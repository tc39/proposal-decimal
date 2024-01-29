.PHONY: all clean

all: spec.html

clean:
	find . -type f -name '*~' -delete
	find . -type f -name '.*~' -delete
	find . -mindepth 1 -maxdepth 1 -type f -name '*.html' -delete

%.html: %.emu biblio.json
	npx ecmarkup --lint-spec --load-biblio @tc39/ecma262-biblio --strict $< $@
