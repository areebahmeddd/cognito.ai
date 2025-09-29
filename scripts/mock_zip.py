import os
import uuid
import random
import zipfile
from datetime import datetime, timedelta


def create_zip(target_zip_path: str, seed: int = None) -> None:
    if seed is not None:
        random.seed(seed)
    start_dt = datetime(2025, 1, 1, 8, 0, 0)
    days = 150
    total_files = random.randint(15, 50)
    types = [
        ("CallLogs", lambda: gen_call_logs(start_dt, days, random.randint(15, 50))),
        (
            "WhatsAppMessages",
            lambda: gen_whatsapp(start_dt, days, random.randint(15, 50)),
        ),
        ("SMS", lambda: gen_sms(start_dt, days, random.randint(15, 50))),
        ("Locations", lambda: gen_locations(start_dt, days, random.randint(15, 50))),
        ("WebHistory", lambda: gen_browsing(start_dt, days, random.randint(15, 50))),
        ("Cookies", lambda: gen_cookies(random.randint(15, 50))),
        (
            "DeviceActivity",
            lambda: gen_device_activity(start_dt, days, random.randint(15, 50)),
        ),
        (
            "FacebookMessages",
            lambda: gen_whatsapp(start_dt, days, random.randint(15, 50)),
        ),
        ("GmailEmails", lambda: gen_emails(start_dt, days, random.randint(15, 50))),
    ]
    used_names = set()
    os.makedirs(os.path.dirname(target_zip_path) or ".", exist_ok=True)
    with zipfile.ZipFile(target_zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for i in range(total_files):
            base, fn = random.choice(types)
            unique = f"{base}_{i + 1:02d}_{uuid.uuid4().hex[:6]}.tsv"
            while unique in used_names:
                unique = f"{base}_{i + 1:02d}_{uuid.uuid4().hex[:6]}.tsv"
            used_names.add(unique)
            zf.writestr(unique, fn())


def build_tsv(headers, rows):
    lines = ["\t".join(headers)]
    for row in rows:
        lines.append("\t".join(str(v) for v in row))
    return "\n".join(lines) + "\n"


INDIAN_FIRST = [
    "Aarav",
    "Vivaan",
    "Aditya",
    "Arjun",
    "Riya",
    "Ananya",
    "Ishita",
    "Priya",
    "Rahul",
    "Karan",
    "Neha",
    "Akshay",
    "Sanjay",
    "Sonia",
    "Vikram",
    "Aditi",
]

INDIAN_LAST = [
    "Sharma",
    "Verma",
    "Gupta",
    "Agarwal",
    "Patel",
    "Reddy",
    "Singh",
    "Kumar",
    "Iyer",
    "Kulkarni",
]

KEYWORDS_NORMAL = [
    "hello",
    "hi",
    "meeting",
    "invoice",
    "delivery",
    "status",
    "thanks",
    "promo",
    "discount",
]

KEYWORDS_SUSPICIOUS = [
    "crypto",
    "bitcoin",
    "ethereum",
    "wallet",
    "trading",
    "gambling",
    "betting",
    "mining",
    "exchange",
]

KEYWORDS_ILLEGAL = [
    "weed",
    "hash",
    "drugs",
    "smuggling",
    "fraud",
    "ransom",
    "kidnapping",
    "forged",
    "stolen",
]


def rnd_indian_number():
    start = random.choice(["6", "7", "8", "9"])
    return "+91" + start + "".join(str(random.randint(0, 9)) for _ in range(9))


def rnd_international_number():
    cc = random.choice(["+1", "+44", "+971", "+61"])
    return cc + "".join(str(random.randint(0, 9)) for _ in range(9))


def rnd_name():
    return random.choice(INDIAN_FIRST) + " " + random.choice(INDIAN_LAST)


def rnd_timestamp(start_dt: datetime, days: int) -> str:
    offset = timedelta(days=random.randint(0, days), minutes=random.randint(0, 1440))
    return (start_dt + offset).isoformat(timespec="seconds")


def gen_call_logs(start_dt: datetime, days: int, n: int):
    rows = []
    for _ in range(n):
        phone = random.choice([rnd_indian_number(), rnd_international_number()])
        duration = random.randint(5, 1200)
        call_type = random.choice(["incoming", "outgoing", "missed"])
        caller_name = rnd_name()
        country = random.choice(["IN", "US", "UK", "AE", "AU"])
        city = random.choice(
            ["Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Pune", "London", "Dubai"]
        )
        rows.append(
            (
                rnd_timestamp(start_dt, days),
                phone,
                duration,
                call_type,
                caller_name,
                country,
                city,
            )
        )
    return build_tsv(
        [
            "timestamp",
            "phone_number",
            "duration",
            "call_type",
            "caller",
            "country",
            "city",
        ],
        rows,
    )


def gen_whatsapp(start_dt: datetime, days: int, n: int):
    rows = []
    for _ in range(n):
        sender = f"{rnd_name()}|{rnd_indian_number()}"
        recipient = f"{rnd_name()}|{random.choice([rnd_indian_number(), rnd_international_number()])}"
        bucket = random.choices(
            [KEYWORDS_NORMAL, KEYWORDS_SUSPICIOUS, KEYWORDS_ILLEGAL], weights=[5, 3, 2]
        )[0]
        word = random.choice(bucket)
        msg = random.choice(
            [
                f"Let's talk about {word}",
                f"Update: {word}",
                f"Need help with {word}",
                f"Deal on {word} today",
                f"{word} confirmed ({random.choice(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'])} 2025)",
            ]
        )
        direction = random.choice(["inbound", "outbound"])
        msg_type = random.choice(["text", "image", "video"])
        platform = "whatsapp"
        rows.append(
            (
                rnd_timestamp(start_dt, days),
                sender,
                recipient,
                direction,
                msg_type,
                platform,
                msg,
            )
        )
    return build_tsv(
        [
            "timestamp",
            "sender",
            "recipient",
            "direction",
            "message_type",
            "platform",
            "message",
        ],
        rows,
    )


def gen_sms(start_dt: datetime, days: int, n: int):
    rows = []
    for _ in range(n):
        sender = random.choice(
            [rnd_indian_number(), "VM-ICICIBK", "VK-AMAZON", "DM-SWIGGY"]
        )
        recipient = rnd_indian_number()
        otp = random.choice([str(random.randint(100000, 999999)), "", ""])
        word = random.choice(KEYWORDS_NORMAL + KEYWORDS_SUSPICIOUS + KEYWORDS_ILLEGAL)
        msg = random.choice(
            [
                f"Your OTP is {otp}",
                f"Promo on {word}",
                f"Alert: {word} detected (Mar 2025)",
                f"Reminder for {word}",
            ]
        )
        service = random.choice(["bank", "ecommerce", "wallet", "operator"])
        rows.append(
            (rnd_timestamp(start_dt, days), sender, recipient, service, msg, otp)
        )
    return build_tsv(
        ["timestamp", "sender", "recipient", "service", "message", "otp_code"], rows
    )


def gen_locations(start_dt: datetime, days: int, n: int):
    rows = []
    for _ in range(n):
        lat = round(random.uniform(8.0, 37.0), 6)
        lon = round(random.uniform(68.0, 97.0), 6)
        acc = random.randint(5, 50)
        place = random.choice(["home", "office", "market", "highway", "airport"])
        rows.append((rnd_timestamp(start_dt, days), lat, lon, acc, place))
    return build_tsv(["timestamp", "latitude", "longitude", "accuracy", "place"], rows)


def gen_browsing(start_dt: datetime, days: int, n: int):
    rows = []
    hosts = [
        "google.com",
        "facebook.com",
        "instagram.com",
        "binance.com",
        "wazirx.com",
        "rummycircle.com",
        "coinmarketcap.com",
        "reddit.com",
        "whatsapp.com",
    ]
    for _ in range(n):
        host = random.choice(hosts)
        url = f"https://{host}/{uuid.uuid4().hex[:8]}"
        title = random.choice(
            KEYWORDS_NORMAL + KEYWORDS_SUSPICIOUS + KEYWORDS_ILLEGAL
        ).title()
        search_term = random.choice(["how to buy", "login", "news", "price", "near me"])
        rows.append(
            (
                rnd_timestamp(start_dt, days),
                title,
                url,
                host,
                search_term,
                random.choice(
                    [
                        "Jan",
                        "Feb",
                        "Mar",
                        "Apr",
                        "May",
                        "Jun",
                        "Jul",
                        "Aug",
                        "Sep",
                        "Oct",
                        "Nov",
                        "Dec",
                    ]
                )
                + " 2025",
            )
        )
    return build_tsv(
        ["timestamp", "title", "url", "host", "search_term", "month"], rows
    )


def gen_cookies(n: int):
    rows = []
    for _ in range(n):
        host = random.choice(
            ["google.com", "binance.com", "facebook.com", "tradingview.com"]
        )
        name = random.choice(["sid", "sessionid", "auth", "csrftoken"])
        value = uuid.uuid4().hex
        path = "/" + uuid.uuid4().hex[:4]
        rows.append((host, name, value, path))
    return build_tsv(["host", "name", "value", "path"], rows)


def gen_device_activity(start_dt: datetime, days: int, n: int):
    rows = []
    events = ["boot", "unlock", "install", "uninstall", "network", "battery_low"]
    details = ["ok", "wifi", "mobile_data", "charging", "idle"]
    device = f"dev-{uuid.uuid4().hex[:6]}"
    for _ in range(n):
        battery = random.randint(5, 100)
        rows.append(
            (
                rnd_timestamp(start_dt, days),
                device,
                random.choice(events),
                random.choice(details),
                battery,
            )
        )
    return build_tsv(["timestamp", "device_id", "event", "detail", "battery"], rows)


def gen_emails(start_dt: datetime, days: int, n: int):
    rows = []
    subjects = [
        "Invoice",
        "Meeting",
        "Update",
        "Security Alert",
        "Password Reset",
        "Welcome",
        "Promo",
        "Offer",
        "KYC",
        "Airdrop",
        "Wallet Notice",
    ]
    for _ in range(n):
        first = random.choice(INDIAN_FIRST).lower()
        last = random.choice(INDIAN_LAST).lower()
        sender = f"{first}.{last}@gmail.com"
        to_first = random.choice(INDIAN_FIRST).lower()
        to_last = random.choice(INDIAN_LAST).lower()
        recipient = f"{to_first}.{to_last}@gmail.com"
        subject = random.choice(subjects)
        snippet = random.choice(
            KEYWORDS_NORMAL + KEYWORDS_SUSPICIOUS + KEYWORDS_ILLEGAL
        )
        direction = random.choice(["inbound", "outbound"])
        rows.append(
            (
                rnd_timestamp(start_dt, days),
                sender,
                recipient,
                subject,
                f"{subject}: {snippet} ({random.choice(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'])} 2025)",
                direction,
            )
        )
    return build_tsv(
        ["timestamp", "from", "to", "subject", "snippet", "direction"], rows
    )


if __name__ == "__main__":
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir))
    zip1 = os.path.join(root, "Test_UFDR-1.zip")
    zip2 = os.path.join(root, "Test_UFDR-2.zip")
    zip3 = os.path.join(root, "Test_UFDR-3.zip")
    create_zip(zip1, seed=1)
    create_zip(zip2, seed=2)
    create_zip(zip3, seed=3)
