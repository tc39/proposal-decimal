.PHONY: all clean

all: index.html

index.html:
	npx ecmarkup --lint-spec --strict --load-biblio @tc39/ecma262-biblio --load-biblio @tc39/ecma402-biblio spec.emu $<

clean:
	rm -f index.html
