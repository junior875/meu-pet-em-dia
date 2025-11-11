import sqlite3
import time
from pathlib import Path
from typing import List, Tuple

DB_PATH = Path(__file__).parent / 'e2e.db'


def _conn():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(str(DB_PATH))
    con.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL,
          password TEXT NOT NULL,
          name TEXT,
          type TEXT NOT NULL,
          created_at INTEGER NOT NULL
        )
        """
    )
    return con


def record_user(email: str, password: str, user_type: str, name: str = "") -> None:
    con = _conn()
    con.execute(
        "INSERT INTO users (email, password, name, type, created_at) VALUES (?,?,?,?,?)",
        (email, password, name, user_type, int(time.time())),
    )
    con.commit()
    con.close()


def get_last_tutors(limit: int = 2) -> List[Tuple[str, str]]:
    con = _conn()
    cur = con.execute(
        "SELECT email, password FROM users WHERE type = 'Tutor' ORDER BY created_at DESC, id DESC LIMIT ?",
        (limit,),
    )
    rows = cur.fetchall()
    con.close()
    return rows


def get_last_vets(limit: int = 1) -> List[Tuple[str, str]]:
    con = _conn()
    cur = con.execute(
        "SELECT email, password FROM users WHERE type = 'Veterinário' ORDER BY created_at DESC, id DESC LIMIT ?",
        (limit,),
    )
    rows = cur.fetchall()
    con.close()
    return rows