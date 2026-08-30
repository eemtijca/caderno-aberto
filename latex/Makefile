# ============================================================
#  Compila os .tex exportados pelo app Notas de Aula
#  (requer notaaula.cls nesta pasta e TeX Live instalado)
#
#  make          compila todas as notas (tema escuro) -> pdf/
#  make claro    versão clara (impressão)             -> pdf/claro/
#  make limpar   remove auxiliares
# ============================================================

NOTAS  := $(wildcard notas/*.tex)
PDFS   := $(patsubst notas/%.tex,pdf/%.pdf,$(NOTAS))
CLAROS := $(patsubst notas/%.tex,pdf/claro/%.pdf,$(NOTAS))

LATEX := TEXINPUTS=.: pdflatex -interaction=nonstopmode -halt-on-error

.PHONY: all claro limpar ajuda

all: $(PDFS)

claro: $(CLAROS)

pdf/%.pdf: notas/%.tex notaaula.cls
	@mkdir -p build pdf
	@echo "==> $< (escuro)"
	@$(LATEX) -output-directory=build $< > build/$*.saida.txt 2>&1 \
	  || { echo "ERRO ao compilar $<:"; sed -n '/^!/,/^l\./p' build/$*.saida.txt | head -30; exit 1; }
	@$(LATEX) -output-directory=build $< > build/$*.saida.txt 2>&1
	@mv build/$*.pdf $@
	@echo "    $@"

pdf/claro/%.pdf: notas/%.tex notaaula.cls
	@mkdir -p build/claro pdf/claro
	@echo "==> $< (claro)"
	@$(LATEX) -output-directory=build/claro -jobname=$* \
	   "\PassOptionsToClass{claro}{notaaula}\input{$<}" > build/claro/$*.saida.txt 2>&1 \
	  || { echo "ERRO ao compilar $<:"; sed -n '/^!/,/^l\./p' build/claro/$*.saida.txt | head -30; exit 1; }
	@$(LATEX) -output-directory=build/claro -jobname=$* \
	   "\PassOptionsToClass{claro}{notaaula}\input{$<}" > build/claro/$*.saida.txt 2>&1
	@mv build/claro/$*.pdf $@
	@echo "    $@"

limpar:
	rm -rf build

ajuda:
	@sed -n '2,8p' Makefile
