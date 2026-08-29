# ============================================================
#  Notas de aula — Prof. Josué Cavalcante
#
#  make               compila todas as notas (tema escuro) -> pdf/
#  make claro         compila todas no tema claro          -> pdf/claro/
#  make pdf/X.pdf     compila só a nota notas/X.tex
#  make nova NOME=... TITULO="..."   cria uma nota nova
#  make lista         lista as notas existentes
#  make limpar        remove os arquivos auxiliares
#  make limpar-tudo   remove auxiliares e PDFs
# ============================================================

NOTAS  := $(wildcard notas/*.tex)
PDFS   := $(patsubst notas/%.tex,pdf/%.pdf,$(NOTAS))
CLAROS := $(patsubst notas/%.tex,pdf/claro/%.pdf,$(NOTAS))

LATEX  := TEXINPUTS=.: pdflatex -interaction=nonstopmode -halt-on-error

.PHONY: all claro lista nova limpar limpar-tudo ajuda

all: $(PDFS)

claro: $(CLAROS)

# tema escuro (padrão)
pdf/%.pdf: notas/%.tex notaaula.cls
	@mkdir -p build pdf
	@echo "==> $< (escuro)"
	@$(LATEX) -output-directory=build $< > build/$*.saida.txt 2>&1 \
	  || { echo "ERRO ao compilar $<:"; sed -n '/^!/,/^l\./p' build/$*.saida.txt | head -30; exit 1; }
	@$(LATEX) -output-directory=build $< > build/$*.saida.txt 2>&1
	@mv build/$*.pdf $@
	@echo "    $@"

# tema claro (para impressão)
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

lista:
	@echo "Notas em notas/:"
	@for f in $(NOTAS); do echo "  $$f"; done

nova:
	@test -n "$(NOME)"   || { echo 'uso: make nova NOME=2026-09-ondas TITULO="Ondas mecânicas"'; exit 1; }
	@test -n "$(TITULO)" || { echo 'uso: make nova NOME=2026-09-ondas TITULO="Ondas mecânicas"'; exit 1; }
	@./nova-nota.sh "$(NOME)" "$(TITULO)" $(if $(CREDITOS),"$(CREDITOS)",)

limpar:
	rm -rf build

limpar-tudo: limpar
	rm -rf pdf

ajuda:
	@sed -n '2,14p' Makefile
