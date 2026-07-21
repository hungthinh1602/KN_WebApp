"""
ProTrader MetaTrader 5 Local Bridge Server - Multi-Account Edition
Yeu cau: Windows + MetaTrader 5 installed + pip install MetaTrader5
Chay: python mt5_bridge.py  (port 8000)

Endpoints:
  POST /api/connect          - Ket noi tai khoan MT5
  GET  /api/status/<login>   - Lay data rieng cua tung tai khoan
  GET  /api/status           - Lay data tai khoan cuoi cung ket noi
"""

import json
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.parse
import urllib.request
from datetime import datetime, timedelta

try:
    import MetaTrader5 as mt5
    MT5_AVAILABLE = True
except ImportError:
    MT5_AVAILABLE = False
    print("WARNING: Chua cai MetaTrader5. Chay: pip install MetaTrader5")

import os

# Load .env manually if it exists
if os.path.exists(".env"):
    try:
        with open(".env", "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    os.environ[key.strip()] = val.strip()
    except Exception as e:
        print("Warning: failed to load .env: ", e)

MT5_TERMINAL_PATH = os.environ.get("MT5_TERMINAL_PATH", r"C:\Program Files\MetaTrader 5\terminal64.exe")

# Multi-session store: key = str(login)
# Each entry: { connected, login, password, server, last_data }
# last_data = cached snapshot from last successful poll
sessions = {}
_poll_lock = False  # prevent concurrent MT5 account switching


def _fetch_account_data(login_str):
    """
    Switch MT5 to this account and fetch fresh data.
    If MT5 cannot switch (another poll in progress, or login fails),
    returns the cached last_data for this account so the UI stays updated.
    """
    global _poll_lock

    session = sessions.get(login_str)
    if not session or not session.get("connected"):
        return None, f"Account {login_str} not connected"

    # If bridge is busy with another account, serve cache
    if _poll_lock:
        cached = session.get("last_data")
        if cached:
            return cached, None
        return None, "Bridge busy, please retry"

    _poll_lock = True
    try:
        authorized = mt5.login(
            login=session["login"],
            password=session["password"],
            server=session["server"]
        )
        if not authorized:
            _poll_lock = False
            cached = session.get("last_data")
            if cached:
                print(f"[WARN] Switch to {login_str} failed, returning cached data")
                return cached, None
            return None, f"MT5 login failed for {login_str}: {mt5.last_error()}"

        acc_info = mt5.account_info()
        acc_dict = acc_info._asdict() if acc_info else {}

        positions = mt5.positions_get()
        open_positions_list = []
        if positions:
            for pos in positions:
                p = pos._asdict()
                open_positions_list.append({
                    "ticket": p.get("ticket"),
                    "symbol": p.get("symbol"),
                    "type": "LONG" if p.get("type") == 0 else "SHORT",
                    "volume": p.get("volume"),
                    "price_open": p.get("price_open"),
                    "price_current": p.get("price_current"),
                    "sl": p.get("sl"),
                    "tp": p.get("tp"),
                    "profit": p.get("profit"),
                    "time": datetime.fromtimestamp(p.get("time")).strftime("%H:%M:%S")
                })

        from_date = datetime.now() - timedelta(days=365)
        history = mt5.history_deals_get(from_date, datetime.now())
        closed_deals_list = []
        if history:
            for deal in history:
                d = deal._asdict()
                if d.get("entry") == 1 and d.get("profit") != 0.0:
                    closed_deals_list.append({
                        "time": datetime.fromtimestamp(d.get("time")).strftime("%d %b %Y %H:%M:%S"),
                        "symbol": d.get("symbol"),
                        "type": "Long" if d.get("type") == 0 else "Short",
                        "volume": d.get("volume"),
                        "profit": d.get("profit"),
                        "price": d.get("price"),
                        "ticket": d.get("ticket")
                    })

        result = {
            "connected": True,
            "login": session["login"],
            "server": session["server"],
            "account": {
                "balance": acc_dict.get("balance"),
                "equity": acc_dict.get("equity"),
                "profit": acc_dict.get("profit"),
                "margin": acc_dict.get("margin"),
                "margin_level": acc_dict.get("margin_level"),
                "name": acc_dict.get("name"),
                "currency": acc_dict.get("currency")
            },
            "open_positions": open_positions_list,
            "closed_deals": closed_deals_list
        }

        # Save to cache so other accounts can still get their own cached data
        sessions[login_str]["last_data"] = result
        print(f"[POLL] {login_str} | {acc_dict.get('name')} | Balance: {acc_dict.get('balance')} {acc_dict.get('currency')} | Trades: {len(closed_deals_list)}")

        _poll_lock = False
        return result, None

    except Exception as e:
        _poll_lock = False
        cached = session.get("last_data")
        if cached:
            return cached, None
        return None, f"Error fetching {login_str}: {str(e)}"


class MT5BridgeHandler(BaseHTTPRequestHandler):

    def log_message(self, format, *args):
        pass  # suppress access logs

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self):
        self.send_response(200)
        self._cors()
        self.end_headers()

    def do_POST(self):
        path = urllib.parse.urlparse(self.path).path
        if path == "/api/bots":
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode("utf-8"))
                with open("bots.json", "w", encoding="utf-8") as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                self._json({"success": True})
            except Exception as e:
                self._json({"success": False, "error": str(e)}, 500)
            return

        if path == "/api/signals":
            print(f"[API] POST /api/signals - Writing updated signals to JSON...")
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode("utf-8"))
                with open("signals.json", "w", encoding="utf-8") as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                self._json({"success": True})
            except Exception as e:
                self._json({"success": False, "error": str(e)}, 500)
            return

        if path == "/api/login":
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode("utf-8"))
                password = data.get("password")
                admin_pass = os.getenv("ADMIN_PASSWORD", "admin123")
                if password == admin_pass:
                    self._json({"success": True, "token": "admin_session_token"})
                else:
                    self._json({"success": False, "error": "Sai mật khẩu!"}, 401)
            except Exception as e:
                self._json({"success": False, "error": str(e)}, 500)
            return

        if path == "/api/telegram-config":
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode("utf-8"))
                with open("telegram_config.json", "w", encoding="utf-8") as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                self._json({"success": True})
            except Exception as e:
                self._json({"success": False, "error": str(e)}, 500)
            return

        if path != "/api/connect":
            self._json({"error": "Not Found"}, 404)
            return

        if not MT5_AVAILABLE:
            self._json({"success": False, "error": "MetaTrader5 not installed"}, 500)
            return

        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 0:
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode("utf-8"))
            else:
                data = {}

            login = data.get("login")
            password = data.get("password")
            server = data.get("server")

            if not login or not password or not server:
                self._json({"success": False, "error": "Missing login, password, or server"}, 400)
                return

            try:
                login_int = int(login)
                login_str = str(login_int)
            except ValueError:
                self._json({"success": False, "error": "Login must be a number"}, 400)
                return

            # Auto-detect terminal path based on server name
            terminal_path = MT5_TERMINAL_PATH
            if not terminal_path and server:
                server_lower = server.lower()
                if "exness" in server_lower:
                    terminal_path = r"C:\Program Files\MetaTrader 5 EXNESS\terminal64.exe"
                elif "gtc" in server_lower:
                    terminal_path = r"C:\Program Files\GTC Global Trade MetaTrader 5\terminal64.exe"

            # Shut down any previous connection first to ensure clean state
            mt5.shutdown()

            init_args = {}
            if terminal_path:
                init_args["path"] = terminal_path
            init_args["login"] = login_int
            init_args["password"] = password
            init_args["server"] = server

            print(f"[INIT] Initializing MT5 with path: {terminal_path} and credentials...")
            initialized = mt5.initialize(**init_args)

            authorized = False
            if initialized:
                authorized = True
            else:
                print(f"[INIT] Direct init failed: {mt5.last_error()}. Trying fallback...")
                if terminal_path:
                    mt5.initialize(path=terminal_path)
                else:
                    mt5.initialize()
                authorized = mt5.login(login_int, password=password, server=server)

            if authorized:
                sessions[login_str] = {
                    "connected": True,
                    "login": login_int,
                    "password": password,
                    "server": server,
                    "last_data": {}
                }
                account = mt5.account_info()
                acc_d = account._asdict() if account else {}
                self._json({"success": True, "account": acc_d})
                print(f"[CONNECT] {login_int} @ {server} | {acc_d.get('name')} | {acc_d.get('balance')} {acc_d.get('currency')}")
            else:
                err = f"Login failed: {mt5.last_error()}"
                sessions[login_str] = {"connected": False, "login": login_int, "password": password, "server": server, "last_data": None}
                self._json({"success": False, "error": err}, 401)

        except Exception as e:
            self._json({"success": False, "error": str(e)}, 500)

    def do_GET(self):
        path = urllib.parse.urlparse(self.path).path

        # GET /api/bots
        if path == "/api/bots":
            if os.path.exists("bots.json"):
                try:
                    with open("bots.json", "r", encoding="utf-8") as f:
                        data = json.load(f)
                    self._json(data)
                except Exception as e:
                    self._json({"error": str(e)}, 500)
            else:
                self._json([])
            return

        # GET /api/signals
        if path == "/api/signals":
            print(f"[API] GET /api/signals - Reading signals list...")
            if os.path.exists("signals.json"):
                try:
                    with open("signals.json", "r", encoding="utf-8") as f:
                        data = json.load(f)
                    self._json(data)
                except Exception as e:
                    self._json({"error": str(e)}, 500)
            else:
                self._json([])
            return

        # GET /api/telegram-config
        if path == "/api/telegram-config":
            if os.path.exists("telegram_config.json"):
                try:
                    with open("telegram_config.json", "r", encoding="utf-8") as f:
                        data = json.load(f)
                    self._json(data)
                except Exception as e:
                    self._json({"error": str(e)}, 500)
            else:
                self._json({"token": "", "chatId": "", "botChatId": "", "autoSend": False})
            return

        # GET /api/price
        if path == "/api/price":
            def fetch_yahoo(symbol):
                url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?interval=1m&range=1d"
                headers = {'User-Agent': 'Mozilla/5.0'}
                req = urllib.request.Request(url, headers=headers)
                try:
                    with urllib.request.urlopen(req, timeout=4) as resp:
                        res_data = json.loads(resp.read().decode())
                        return res_data['chart']['result'][0]['meta']['regularMarketPrice']
                except Exception:
                    return None

            def fetch_gold_spot():
                url = "https://api.gold-api.com/price/XAU"
                headers = {'User-Agent': 'Mozilla/5.0'}
                req = urllib.request.Request(url, headers=headers)
                try:
                    with urllib.request.urlopen(req, timeout=4) as resp:
                        res_data = json.loads(resp.read().decode())
                        return res_data.get("price")
                except Exception:
                    return None

            gold_price = fetch_gold_spot() or fetch_yahoo("GC=F")
            btc_price = fetch_yahoo("BTC-USD")
            self._json({
                "XAU": round(gold_price, 2) if gold_price else 4019.80,
                "BTC": btc_price or 64500.00
            })
            return

        if not MT5_AVAILABLE:
            self._json({"connected": False, "error": "MetaTrader5 not installed. Run: pip install MetaTrader5"})
            return

        # GET /api/status/<login>
        if path.startswith("/api/status/"):
            login_str = path.split("/api/status/")[-1].strip("/")
            if login_str not in sessions:
                self._json({"connected": False, "error": f"Account {login_str} not found. Please connect first."})
                return
            result, err = _fetch_account_data(login_str)
            if err:
                self._json({"connected": False, "error": err})
            else:
                self._json(result)
            return

        # GET /api/status  (last connected account, backward compat)
        if path == "/api/status":
            connected = [s for s in sessions.values() if s.get("connected")]
            if not connected:
                self._json({"connected": False, "error": "No MT5 accounts connected yet."})
                return
            first = str(connected[0]["login"])
            result, err = _fetch_account_data(first)
            if err:
                self._json({"connected": False, "error": err})
            else:
                self._json(result)
            return

        self._json({"error": "Not Found"}, 404)

    def _json(self, data, code=200):
        try:
            body = json.dumps(data).encode("utf-8")
            self.send_response(code)
            self.send_header("Content-Type", "application/json")
            self._cors()
            self.end_headers()
            self.wfile.write(body)
        except ConnectionAbortedError:
            pass  # Client ngat ket noi som (timeout), bo qua loi
        except Exception as e:
            pass  # Bo qua cac loi socket khac


def run_server(port=8000):
    httpd = HTTPServer(("", port), MT5BridgeHandler)
    print("=" * 52)
    print(f"  MT5 Bridge (Multi-Account) - Port {port}")
    print(f"  Per-account: http://localhost:{port}/api/status/<login>")
    print(f"  Connect:     POST http://localhost:{port}/api/connect")
    print(f"  Press Ctrl+C to stop.")
    print("=" * 52)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping...")
        if MT5_AVAILABLE:
            mt5.shutdown()
        sys.exit(0)


if __name__ == "__main__":
    run_server()