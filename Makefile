.PHONY: all clean

all: spec.html intl-spec.html

clean:
	find . -type f -name '*~' -delete
	find . -type f -name '.*~' -delete

%.html: %.emu
	npx ecmarkup --lint-spec --strict $< $@
