"""Read-only availability probe. Run before release; does not reserve a name."""

import argparse
import ssl
import sys
from urllib.error import HTTPError, URLError
from urllib.request import urlopen

parser = argparse.ArgumentParser()
parser.add_argument("--ca-file", help="Optional path to a trusted CA bundle")
args = parser.parse_args()
try:
    with urlopen(
        "https://pypi.org/pypi/django-modelsheet/json",
        timeout=15,
        context=ssl.create_default_context(cafile=args.ca_file),
    ) as response:
        print("django-modelsheet is already registered; inspect ownership before publishing.")
except HTTPError as exc:
    if exc.code != 404:
        raise
    print("django-modelsheet is currently unregistered (not a reservation).")
except (URLError, TimeoutError) as exc:
    print(f"Could not verify PyPI availability: {exc}", file=sys.stderr)
    sys.exit(2)
