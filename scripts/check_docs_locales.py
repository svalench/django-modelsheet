"""Require complete translations so shared-asset fallback cannot hide missing pages."""

from pathlib import Path

import yaml


def main():
    root = Path(__file__).resolve().parents[1]
    config = yaml.safe_load((root / "mkdocs.yml").read_text())
    i18n = next(plugin["i18n"] for plugin in config["plugins"] if "i18n" in plugin)
    locales = [language["locale"] for language in i18n["languages"]]
    assert locales == ["en", "zh", "be"], "Only English, Chinese and Belarusian may be built"
    docs = root / "docs"
    pages = [p for p in docs.rglob("*.md") if not p.stem.endswith((".zh", ".be"))]
    expected = set(pages)
    for page in pages:
        assert not any("\u0400" <= char <= "\u04ff" for char in page.read_text()), (
            f"Unexpected Cyrillic text in English page: {page}"
        )
        for locale in ("zh", "be"):
            translated = page.with_name(f"{page.stem}.{locale}.md")
            expected.add(translated)
            assert translated.is_file(), f"Missing translation: {translated}"
            content = translated.read_text()
            assert content.strip() and "# " in content, f"Empty translation: {translated}"
    assert set(docs.rglob("*.md")) == expected, "Unexpected language or orphan translation"
    print(f"Complete documentation: {len(pages)} pages × {len(locales)} languages")


if __name__ == "__main__":
    main()
