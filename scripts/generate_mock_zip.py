import os
import zipfile


def build_tsv(headers, rows):
    lines = ["\t".join(headers)]
    for row in rows:
        lines.append("\t".join(str(v) for v in row))
    return "\n".join(lines) + "\n"


def create_mock_zip(target_zip_path: str, variant: str = "A") -> None:
    if variant == "A":
        data = {
            "CallLogs.tsv": build_tsv(
                ["timestamp", "phone_number", "duration", "call_type"],
                [
                    ("2024-01-15T09:15:00", "1234567890", 120, "outgoing"),
                    ("2024-01-15T10:05:00", "5551112222", 45, "incoming"),
                    ("2024-01-15T11:30:00", "9876543210", 300, "missed"),
                ],
            ),
            "Messages.tsv": build_tsv(
                ["timestamp", "sender", "recipient", "message"],
                [
                    (
                        "2024-01-15T12:00:00",
                        "alice@example.com",
                        "bob@example.com",
                        "Hello Bob",
                    ),
                    (
                        "2024-01-15T12:05:00",
                        "bob@example.com",
                        "alice@example.com",
                        "Hi Alice",
                    ),
                ],
            ),
            "Locations.tsv": build_tsv(
                ["timestamp", "latitude", "longitude", "accuracy"],
                [
                    ("2024-01-15T13:00:00", 40.7128, -74.0060, 10),
                    ("2024-01-15T13:05:00", 40.7130, -74.0055, 8),
                ],
            ),
        }
    else:
        data = {
            "CallLogs.tsv": build_tsv(
                ["timestamp", "phone_number", "duration", "call_type"],
                [
                    ("2024-02-01T08:10:00", "1112223333", 60, "outgoing"),
                    ("2024-02-01T09:45:00", "4445556666", 180, "incoming"),
                ],
            ),
            "Messages.tsv": build_tsv(
                ["timestamp", "sender", "recipient", "message"],
                [
                    (
                        "2024-02-01T10:00:00",
                        "charlie@example.com",
                        "dana@example.com",
                        "Meeting at 2",
                    ),
                    (
                        "2024-02-01T10:10:00",
                        "dana@example.com",
                        "charlie@example.com",
                        "Confirmed",
                    ),
                    (
                        "2024-02-01T10:20:00",
                        "charlie@example.com",
                        "dana@example.com",
                        "See you then",
                    ),
                ],
            ),
            "Devices.tsv": build_tsv(
                ["timestamp", "device_id", "event", "detail"],
                [
                    ("2024-02-01T07:00:00", "dev-001", "boot", "normal"),
                    ("2024-02-01T07:05:00", "dev-001", "network", "wifi-connected"),
                ],
            ),
        }

    os.makedirs(os.path.dirname(target_zip_path) or ".", exist_ok=True)

    with zipfile.ZipFile(target_zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for filename, content in data.items():
            zf.writestr(filename, content)


if __name__ == "__main__":
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir))
    zip_a = os.path.join(root, "TSV_Exports_A.zip")
    zip_b = os.path.join(root, "TSV_Exports_B.zip")
    create_mock_zip(zip_a, variant="A")
    create_mock_zip(zip_b, variant="B")
    print(f"Created: {zip_a}")
    print(f"Created: {zip_b}")
