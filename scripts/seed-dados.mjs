// Massa realista da semente de desenvolvimento: professores, turmas, disciplinas e aulas.
// Os textos seguem a convenção editorial do repositório, sem travessão nem segunda pessoa.

export const SENHA_SEMENTE = "semente123";

export const PROFESSORES = [
  {
    chave: "helena",
    nome: "Helena Duarte",
    email: "helena.duarte@exemplo.br",
    escola: "EE Professora Carolina Ribeiro",
  },
  {
    chave: "marcos",
    nome: "Marcos Pereira",
    email: "marcos.pereira@exemplo.br",
    escola: "EE Professora Carolina Ribeiro",
  },
  {
    chave: "sofia",
    nome: "Sofia Almeida",
    email: "sofia.almeida@exemplo.br",
    escola: "EE Professora Carolina Ribeiro",
  },
];

// Turmas A, B e C do 1º ao 3º ano, três por professor.
export const TURMAS = [
  { professor: "helena", nome: "1A", serie: "1º ano" },
  { professor: "helena", nome: "2A", serie: "2º ano" },
  { professor: "helena", nome: "3A", serie: "3º ano" },
  { professor: "marcos", nome: "1B", serie: "1º ano" },
  { professor: "marcos", nome: "2B", serie: "2º ano" },
  { professor: "marcos", nome: "3B", serie: "3º ano" },
  { professor: "sofia", nome: "1C", serie: "1º ano" },
  { professor: "sofia", nome: "2C", serie: "2º ano" },
  { professor: "sofia", nome: "3C", serie: "3º ano" },
];

export const DISCIPLINAS = [
  {
    chave: "matematica",
    professor: "helena",
    nome: "Matemática",
    cor: "ciano",
    icone: "Calculator",
    ordem: 1,
    aulas: [
      {
        titulo: "Conjuntos numéricos",
        mes: 2,
        serie: "1º ano",
        sobre:
          "Os conjuntos naturais, inteiros, racionais e reais, com representação decimal e reta numérica.",
        habilidades: "EM13MAT101, EM13MAT102",
        intro:
          "A aula organiza os números em conjuntos e mostra como cada conjunto amplia o anterior, até chegar aos números reais usados nas medidas do cotidiano.",
        definicao:
          "O conjunto dos **números naturais** reúne 0, 1, 2, 3 e assim por diante; os **inteiros** acrescentam os negativos; os **racionais** cobrem frações e decimais exatos ou periódicos; os **irracionais** têm decimal infinito e não periódico, como $\\sqrt{2}$ e $\\pi$; a união de racionais e irracionais forma os **reais**.",
        itens: [
          "Naturais: contagem e ordem.",
          "Inteiros: saldos, temperaturas e altitudes.",
          "Racionais: frações e dízimas periódicas.",
          "Irracionais: raízes não exatas e o número pi.",
        ],
        chamada: {
          estilo: "simbolos",
          texto: "$\\mathbb{N}\\subset\\mathbb{Z}\\subset\\mathbb{Q}\\subset\\mathbb{R}$.",
        },
        exemplo:
          "Classifique $\\frac{7}{2}$, $-3$, $\\sqrt{9}$ e $\\sqrt{5}$ nos conjuntos numéricos.",
        resolucao:
          "$\\frac{7}{2}=3{,}5$ é racional; $-3$ é inteiro; $\\sqrt{9}=3$ é natural; $\\sqrt{5}=2{,}236...$ é irracional. \\resultado{Todos os quatro pertencem aos reais.}",
        dica: "Raiz exata de número natural é racional; raiz não exata é irracional.",
        quiz: [
          {
            e: "Qual dos números é irracional?",
            alt: ["$\\sqrt{16}$", "$\\sqrt{7}$", "$0{,}25$", "$\\frac{3}{4}$"],
            correta: 1,
          },
          {
            e: "A que conjuntos pertence o número $-5$?",
            alt: ["Apenas aos naturais", "Aos inteiros e aos racionais", "Apenas aos irracionais"],
            correta: 1,
          },
        ],
        aberta: "Explique por que todo número natural é também racional.",
        gabarito: "Todo natural pode ser escrito como fração de denominador 1.",
      },
      {
        titulo: "Função afim",
        mes: 3,
        serie: "1º ano",
        sobre:
          "Definição, gráfico e taxa de variação da função afim, com aplicações em tarifas e consumo.",
        habilidades: "EM13MAT302, EM13MAT401",
        intro:
          "A função afim modela situações com valor fixo e cobrança proporcional, como planos de internet, corridas de aplicativo e contas de água.",
        definicao:
          "Uma **função afim** é toda função de $\\mathbb{R}$ em $\\mathbb{R}$ dada por $f(x)=ax+b$, com $a$ e $b$ reais e $a\\neq 0$.",
        formula: "f(x) = ax + b",
        itens: [
          "O coeficiente $a$ é a taxa de variação.",
          "O coeficiente $b$ é o valor de $f(0)$.",
          "O gráfico é sempre uma reta.",
          "Com $a>0$ a função cresce; com $a<0$ ela decresce.",
        ],
        chamada: {
          estilo: "diaadia",
          texto:
            "A corrida de aplicativo cobra um valor fixo de partida e um preço por quilômetro: $f(x)=2{,}50x+5$.",
        },
        exemplo:
          "Um plano de internet custa R$ 60,00 fixos mais R$ 4,00 por GB excedente. Escreva a função do custo e calcule o valor para 7 GB excedentes.",
        resolucao:
          "O custo é $C(x)=4x+60$. Para $x=7$: $C(7)=4\\cdot 7+60=88$. \\resultado{O custo é R$ 88,00.}",
        tabela: [
          ["GB excedentes", "Custo (R$)"],
          ["0", "60"],
          ["2", "68"],
          ["5", "80"],
        ],
        dica: "A taxa de variação mede a mudança de $y$ para cada aumento de 1 unidade em $x$.",
        quiz: [
          {
            e: "O gráfico da função $f(x)=-2x+8$ é:",
            alt: ["Uma reta crescente", "Uma reta decrescente", "Uma parábola"],
            correta: 1,
          },
          {
            e: "Em $f(x)=5x-4$, qual é o valor de $f(3)$?",
            alt: ["11", "15", "19", "9"],
            correta: 0,
          },
        ],
        aberta:
          "Uma empresa cobra R$ 30,00 fixos e R$ 1,50 por entrega. Escreva a função do custo e calcule o valor de 12 entregas.",
        gabarito: "$C(x)=1{,}5x+30$ e $C(12)=48$, ou seja, R$ 48,00.",
      },
      {
        titulo: "Função quadrática",
        mes: 4,
        serie: "1º ano",
        sobre:
          "Concavidade, vértice, raízes e gráfico da função quadrática aplicada a lançamentos e lucros.",
        habilidades: "EM13MAT302, EM13MAT402",
        intro:
          "A parábola aparece em lançamentos de projéteis, na área de terrenos e em problemas de máximo lucro.",
        definicao:
          "Uma **função quadrática** é dada por $f(x)=ax^2+bx+c$, com $a$, $b$ e $c$ reais e $a\\neq 0$. O sinal de $a$ define a concavidade.",
        formula: "f(x) = ax^{2} + bx + c",
        itens: [
          "Com $a>0$ a concavidade é para cima e existe mínimo.",
          "Com $a<0$ a concavidade é para baixo e existe máximo.",
          "As raízes resolvem $ax^2+bx+c=0$.",
          "O vértice fica em $x_v=-\\frac{b}{2a}$.",
        ],
        chamada: {
          estilo: "simbolos",
          texto: "$\\Delta=b^2-4ac$; com $\\Delta>0$ há duas raízes reais distintas.",
        },
        exemplo: "Determine as raízes de $f(x)=x^2-5x+6$.",
        resolucao:
          "$\\Delta=25-24=1$, então $x=\\frac{5\\pm 1}{2}$, com $x_1=3$ e $x_2=2$. \\resultado{As raízes são 2 e 3.}",
        dica: "Antes de usar a fórmula, confira se a equação pode ser fatorada mentalmente.",
        quiz: [
          {
            e: "Qual é o vértice de $f(x)=x^2-4x+1$?",
            alt: ["$(2,-3)$", "$(-2,-3)$", "$(2,3)$", "$(4,1)$"],
            correta: 0,
          },
          {
            e: "A concavidade de $f(x)=-3x^2+2x$ é:",
            alt: ["Para cima", "Para baixo", "Não existe concavidade"],
            correta: 1,
          },
        ],
        aberta:
          "A receita de uma loja é $R(x)=-x^2+40x$, em reais, para $x$ unidades. Qual quantidade maximiza a receita?",
        gabarito: "O máximo ocorre no vértice: $x=20$ unidades, com receita de R$ 400,00.",
      },
      {
        titulo: "Progressões aritméticas",
        mes: 3,
        serie: "2º ano",
        sobre:
          "Termo geral e soma dos termos de uma progressão aritmética, com aplicações em parcelamentos.",
        habilidades: "EM13MAT301, EM13MAT403",
        intro:
          "Uma progressão aritmética cresce sempre com o mesmo passo, o que permite prever termos distantes sem listar toda a sequência.",
        definicao:
          "**Progressão aritmética** é toda sequência em que cada termo, a partir do segundo, é obtido somando uma constante $r$ ao anterior.",
        formula: "a_{n} = a_{1} + (n-1)r",
        itens: [
          "A razão $r$ é a diferença entre termos consecutivos.",
          "Com $r>0$ a sequência cresce; com $r<0$ decresce.",
          "A soma dos $n$ primeiros termos é $S_n=\\frac{(a_1+a_n)n}{2}$.",
        ],
        chamada: {
          estilo: "diaadia",
          texto:
            "Uma poupança que recebe R$ 50,00 a mais a cada mês segue uma progressão aritmética.",
        },
        exemplo: "Na sequência 7, 12, 17, ..., qual é o 30º termo?",
        resolucao:
          "$a_1=7$, $r=5$ e $n=30$: $a_{30}=7+29\\cdot 5=152$. \\resultado{O 30º termo é 152.}",
        dica: "Confira se o primeiro termo já recebe o acréscimo antes de aplicar a fórmula.",
        quiz: [
          {
            e: "Qual é a razão da sequência 20, 17, 14, 11?",
            alt: ["3", "-3", "-2", "2"],
            correta: 1,
          },
          {
            e: "O 10º termo de uma progressão com $a_1=4$ e $r=3$ é:",
            alt: ["31", "34", "30", "27"],
            correta: 0,
          },
        ],
        aberta:
          "Um estacionamento cobra R$ 8,00 pela primeira hora e R$ 3,00 por hora adicional. Quanto custa permanecer 6 horas?",
        gabarito: "Os valores formam uma progressão com $a_1=8$ e $r=3$; o 6º termo é R$ 23,00.",
      },
      {
        titulo: "Progressões geométricas",
        mes: 4,
        serie: "2º ano",
        sobre: "Termo geral e soma de progressões geométricas, com crescimento percentual e juros.",
        habilidades: "EM13MAT301, EM13MAT404",
        intro:
          "Quando cada termo é multiplicado por um fator constante, o crescimento é geométrico e muito mais rápido do que o aritmético.",
        definicao:
          "**Progressão geométrica** é toda sequência em que cada termo, a partir do segundo, é obtido multiplicando o anterior por uma constante $q$.",
        formula: "a_{n} = a_{1} \\cdot q^{n-1}",
        itens: [
          "A razão $q$ é o quociente entre termos consecutivos.",
          "Com $q>1$ a sequência cresce; com $0<q<1$ decresce.",
          "Aumentos percentuais constantes geram progressões geométricas.",
        ],
        chamada: {
          estilo: "simbolos",
          texto: "Um aumento de 10 por cento ao ano corresponde a $q=1{,}10$.",
        },
        exemplo: "Uma população de 2.000 bactérias dobra a cada hora. Qual o total após 5 horas?",
        resolucao:
          "$a_1=2000$ e $q=2$: $a_6=2000\\cdot 2^5=64000$. \\resultado{São 64.000 bactérias.}",
        dica: "Dobrar cinco vezes não é o mesmo que somar cinco vezes o valor inicial.",
        quiz: [
          {
            e: "Qual é a razão da sequência 3, 6, 12, 24?",
            alt: ["2", "3", "6", "1,5"],
            correta: 0,
          },
          {
            e: "Um produto de R$ 100,00 sofre aumento de 10 por cento ao mês. Após 2 meses, o preço é:",
            alt: ["R$ 120,00", "R$ 121,00", "R$ 110,00", "R$ 122,10"],
            correta: 1,
          },
        ],
        aberta:
          "Explique a diferença entre um crescimento que soma R$ 100,00 por mês e outro que aumenta 10 por cento ao mês.",
        gabarito: "O primeiro é aritmético e linear; o segundo é geométrico e acelera com o tempo.",
      },
      {
        titulo: "Trigonometria no triângulo retângulo",
        mes: 6,
        serie: "1º ano",
        sobre: "Seno, cosseno e tangente para calcular alturas e distâncias inacessíveis.",
        habilidades: "EM13MAT306, EM13MAT308",
        intro:
          "As razões trigonométricas permitem medir alturas de prédios e larguras de rios sem chegar até eles.",
        definicao:
          "Em um triângulo retângulo, o **seno** de um ângulo agudo é a razão entre o cateto oposto e a hipotenusa; o **cosseno**, entre o cateto adjacente e a hipotenusa; a **tangente**, entre os dois catetos.",
        formula:
          "\\operatorname{tg}\\theta = \\frac{\\text{cateto oposto}}{\\text{cateto adjacente}}",
        itens: [
          "Ângulos notáveis: 30, 45 e 60 graus.",
          "$\\operatorname{sen}30^\\circ=0{,}5$ e $\\cos 60^\\circ=0{,}5$.",
          "$\\operatorname{tg}45^\\circ=1$.",
        ],
        chamada: {
          estilo: "simbolos",
          texto: "$\\operatorname{sen}^2\\theta+\\cos^2\\theta=1$.",
        },
        exemplo:
          "Uma escada de 5 m está apoiada em uma parede e forma 60 graus com o chão. A que altura chega o topo?",
        resolucao:
          "$\\operatorname{sen}60^\\circ=\\frac{h}{5}$, então $h=5\\cdot 0{,}866=4{,}33$. \\resultado{A altura é de aproximadamente 4,33 m.}",
        dica: "Identifique primeiro a hipotenusa; ela é sempre o lado oposto ao ângulo reto.",
        quiz: [
          {
            e: "Em um triângulo retângulo, a razão entre cateto oposto e hipotenusa é o:",
            alt: ["Cosseno", "Seno", "Tangente", "Ângulo"],
            correta: 1,
          },
          {
            e: "Quanto vale $\\operatorname{tg}45^\\circ$?",
            alt: ["0", "0,5", "1", "1,73"],
            correta: 2,
          },
        ],
        aberta:
          "Um poste projeta sombra de 8 m quando o ângulo do sol é 45 graus. Qual a altura do poste?",
        gabarito: "Com tangente igual a 1, a altura é igual à sombra: 8 m.",
      },
      {
        titulo: "Geometria espacial: prismas",
        mes: 5,
        serie: "2º ano",
        sobre: "Área da superfície e volume de prismas retos, com unidades e conversões.",
        habilidades: "EM13MAT309, EM13MAT504",
        intro:
          "Caixas, blocos e reservatórios têm forma de prisma; calcular área e volume ajuda a estimar material e capacidade.",
        definicao:
          "**Prisma** é o sólido com duas bases paralelas e iguais e faces laterais retangulares. O volume é a área da base multiplicada pela altura.",
        formula: "V = A_{b} \\cdot h",
        itens: [
          "Paralelepípedo: $V=comprimento\\cdot largura\\cdot altura$.",
          "Cubo: $V=a^3$.",
          "A área total soma as duas bases e as faces laterais.",
        ],
        chamada: {
          estilo: "diaadia",
          texto: "1 litro equivale a 1 decímetro cúbico, o que liga volume e capacidade.",
        },
        exemplo: "Uma caixa d'água mede 1,5 m por 1 m por 0,8 m. Quantos litros ela armazena?",
        resolucao:
          "$V=1{,}5\\cdot 1\\cdot 0{,}8=1{,}2\\,m^3=1200\\,L$. \\resultado{A caixa armazena 1.200 litros.}",
        dica: "Converta todas as medidas para a mesma unidade antes de multiplicar.",
        quiz: [
          {
            e: "O volume de um cubo de aresta 4 cm é:",
            alt: ["16 cm³", "48 cm³", "64 cm³", "12 cm³"],
            correta: 2,
          },
          {
            e: "Um prisma de base 20 cm² e altura 10 cm tem volume:",
            alt: ["200 cm³", "30 cm³", "2 cm³", "100 cm³"],
            correta: 0,
          },
        ],
        aberta:
          "Um aquário retangular mede 60 cm por 30 cm por 40 cm. Quantos litros de água cabem nele?",
        gabarito: "$V=72.000\\,cm^3=72\\,L$.",
      },
      {
        titulo: "Estatística: média, mediana e moda",
        mes: 3,
        serie: "3º ano",
        sobre: "Medidas de tendência central e leitura crítica de gráficos e tabelas.",
        habilidades: "EM13MAT102, EM13MAT406",
        intro:
          "Média, mediana e moda resumem um conjunto de dados de formas diferentes, e a escolha da medida muda a leitura da realidade.",
        definicao:
          "A **média** soma os valores e divide pela quantidade; a **mediana** é o valor central dos dados ordenados; a **moda** é o valor mais frequente.",
        itens: [
          "A mediana resiste melhor a valores extremos.",
          "A média sofre influência de outliers.",
          "Pode haver mais de uma moda ou nenhuma.",
        ],
        chamada: {
          estilo: "atencao",
          texto: "Uma média alta pode esconder grande desigualdade entre os valores.",
        },
        exemplo: "Notas de uma turma: 4, 6, 6, 7, 9, 10, 10. Calcule média, mediana e moda.",
        resolucao:
          "Média: $\\frac{52}{7}=7{,}43$. Mediana: 7. Moda: 6 e 10. \\resultado{Média 7,43, mediana 7 e duas modas.}",
        figura: "Distribuição de notas de uma turma fictícia, com destaque para a mediana.",
        dica: "Ordene os dados antes de localizar a mediana.",
        quiz: [
          {
            e: "Qual medida é menos afetada por um valor muito extremo?",
            alt: ["Média", "Mediana", "Total", "Soma"],
            correta: 1,
          },
          {
            e: "No conjunto 2, 3, 3, 5, 9, a moda é:",
            alt: ["3", "5", "4,4", "9"],
            correta: 0,
          },
        ],
        aberta:
          "Uma empresa divulga apenas o salário médio. Explique por que a mediana pode descrever melhor a realidade dos funcionários.",
        gabarito: "Salários muito altos puxam a média; a mediana mostra o valor central.",
      },
      {
        titulo: "Probabilidade",
        mes: 4,
        serie: "3º ano",
        sobre: "Espaço amostral, eventos e cálculo de probabilidades simples e complementares.",
        habilidades: "EM13MAT106, EM13MAT407",
        intro:
          "A probabilidade quantifica a chance de um evento e aparece em previsões, jogos, seguros e diagnósticos médicos.",
        definicao:
          "A **probabilidade** de um evento é a razão entre o número de casos favoráveis e o número de casos possíveis, quando todos têm a mesma chance.",
        formula: "P(A) = \\frac{n(A)}{n(\\Omega)}",
        itens: [
          "A probabilidade varia de 0 a 1.",
          "O evento complementar tem $P(\\bar{A})=1-P(A)$.",
          "Eventos independentes multiplicam as probabilidades.",
        ],
        chamada: {
          estilo: "diaadia",
          texto: "A previsão de chuva de 70 por cento indica a chance estimada de chuva na região.",
        },
        exemplo: "Ao lançar um dado honesto, qual a probabilidade de sair número par?",
        resolucao:
          "Casos favoráveis: 2, 4 e 6, ou seja, 3 de 6. $P=\\frac{3}{6}=0{,}5$. \\resultado{A probabilidade é 50 por cento.}",
        dica: "Confira se todos os resultados possíveis têm a mesma chance antes de dividir.",
        quiz: [
          {
            e: "Em uma urna com 5 bolas vermelhas e 3 azuis, a probabilidade de sair azul é:",
            alt: ["$\\frac{3}{8}$", "$\\frac{5}{8}$", "$\\frac{3}{5}$", "$\\frac{1}{2}$"],
            correta: 0,
          },
          {
            e: "Se $P(A)=0{,}3$, a probabilidade do complemento é:",
            alt: ["0,3", "0,7", "1", "0,6"],
            correta: 1,
          },
        ],
        aberta: "Em dois lançamentos de uma moeda, qual a probabilidade de sair cara nos dois?",
        gabarito: "$\\frac{1}{2}\\cdot\\frac{1}{2}=\\frac{1}{4}$, ou 25 por cento.",
      },
      {
        titulo: "Logaritmos",
        mes: 8,
        serie: "2º ano",
        sobre: "Definição, propriedades e aplicações de logaritmos em escalas e crescimentos.",
        habilidades: "EM13MAT305, EM13MAT403",
        intro:
          "Logaritmos invertem a exponenciação e aparecem em escalas como pH, decibéis e magnitude de terremotos.",
        definicao:
          "O **logaritmo** de um número $b$ na base $a$ é o expoente $x$ tal que $a^x=b$, com $a>0$, $a\\neq 1$ e $b>0$.",
        formula: "\\log_{a} b = x \\iff a^{x} = b",
        itens: [
          "$\\log_a 1 = 0$ e $\\log_a a = 1$.",
          "$\\log_a (mn)=\\log_a m+\\log_a n$.",
          "$\\log_a m^n=n\\log_a m$.",
        ],
        chamada: {
          estilo: "simbolos",
          texto: "$\\log_{10} 1000=3$ porque $10^3=1000$.",
        },
        exemplo: "Calcule $\\log_2 32$.",
        resolucao: "$2^5=32$, então $\\log_2 32=5$. \\resultado{O logaritmo vale 5.}",
        dica: "Pergunte sempre: qual expoente transforma a base no número dado?",
        quiz: [
          {
            e: "Quanto vale $\\log_{10} 100$?",
            alt: ["1", "2", "10", "100"],
            correta: 1,
          },
          {
            e: "A igualdade $\\log_a 1 = 0$ vale para:",
            alt: ["Apenas $a=10$", "Qualquer base válida $a>0$ com $a\\neq 1$", "Nenhuma base"],
            correta: 1,
          },
        ],
        aberta:
          "A escala de pH usa logaritmo na base 10. Explique o que significa uma solução ter pH 3.",
        gabarito: "A concentração de íons hidrogênio é $10^{-3}$ mol por litro.",
      },
      {
        titulo: "Juros compostos",
        mes: 9,
        serie: "3º ano",
        sobre:
          "Fórmula dos juros compostos, comparação com juros simples e planejamento financeiro.",
        habilidades: "EM13MAT303, EM13MAT401",
        intro:
          "Nos juros compostos, os juros do período anterior passam a render também, e o montante cresce de forma exponencial.",
        definicao:
          "O **montante** em juros compostos é calculado por $M=C(1+i)^n$, em que $C$ é o capital, $i$ a taxa por período e $n$ o número de períodos.",
        formula: "M = C \\cdot (1+i)^{n}",
        itens: [
          "A taxa e o tempo precisam estar na mesma unidade.",
          "Juros simples somam $C\\cdot i\\cdot n$ ao capital.",
          "Pequenas taxas, em prazos longos, geram grande diferença.",
        ],
        chamada: {
          estilo: "atencao",
          texto:
            "No crédito parcelado, a taxa mensal informada costuma embutir encargos adicionais.",
        },
        exemplo: "Um capital de R$ 1.000,00 rende 2 por cento ao mês por 6 meses. Qual o montante?",
        resolucao:
          "$M=1000\\cdot (1{,}02)^6=1000\\cdot 1{,}1262=1126{,}20$. \\resultado{O montante é R$ 1.126,20.}",
        figura: "Evolução de um capital com juros simples e compostos ao longo de doze meses.",
        dica: "Não multiplique a taxa pelo prazo; isso vale apenas para juros simples.",
        quiz: [
          {
            e: "Nos juros compostos, os juros de cada período:",
            alt: [
              "Não influenciam o período seguinte",
              "Passam a render no período seguinte",
              "São sempre iguais ao capital",
              "São descontados do capital",
            ],
            correta: 1,
          },
          {
            e: "Um capital de R$ 500,00 a 10 por cento ao mês, por 2 meses, gera montante de:",
            alt: ["R$ 600,00", "R$ 605,00", "R$ 550,00", "R$ 610,00"],
            correta: 1,
          },
        ],
        aberta:
          "Explique por que juros compostos são vantajosos em investimentos e perigosos no crédito rotativo.",
        gabarito: "O crescimento exponencial favorece quem recebe juros e penaliza quem paga.",
      },
    ],
  },
  {
    chave: "fisica",
    professor: "helena",
    nome: "Física",
    cor: "violeta",
    icone: "Atom",
    ordem: 2,
    aulas: [
      {
        titulo: "Velocidade média e movimento uniforme",
        mes: 2,
        serie: "1º ano",
        sobre:
          "Definição de velocidade média, conversão de unidades e leitura do gráfico posição por tempo.",
        habilidades: "EM13CNT101, EM13CNT302",
        intro:
          "A cinemática descreve o movimento sem investigar as forças envolvidas, usando posição, tempo e velocidade.",
        definicao:
          "A **velocidade média** é a razão entre o deslocamento e o intervalo de tempo: $v_m=\\frac{\\Delta s}{\\Delta t}$. No **movimento uniforme**, a velocidade é constante e o gráfico $s\\times t$ é uma reta.",
        formula: "v_{m} = \\frac{\\Delta s}{\\Delta t}",
        itens: [
          "$1\\,m/s=3{,}6\\,km/h$.",
          "No movimento uniforme, $s=s_0+vt$.",
          "A inclinação da reta mede a velocidade.",
        ],
        chamada: {
          estilo: "diaadia",
          texto: "O aplicativo de corrida mostra a velocidade média de cada trecho percorrido.",
        },
        exemplo: "Um ciclista percorre 12 km em 30 minutos. Qual a velocidade média em m/s?",
        resolucao:
          "$30\\,min=1800\\,s$ e $12\\,km=12000\\,m$, então $v_m=\\frac{12000}{1800}=6{,}67\\,m/s$. \\resultado{A velocidade média é 6,67 m/s.}",
        figura: "Gráfico posição por tempo de um móvel em movimento uniforme.",
        dica: "Converta as unidades antes de dividir; km/h e m/s não se misturam.",
        quiz: [
          {
            e: "Um carro percorre 180 km em 2 horas. A velocidade média é:",
            alt: ["90 km/h", "60 km/h", "180 km/h", "45 km/h"],
            correta: 0,
          },
          {
            e: "No movimento uniforme, o gráfico da posição em função do tempo é:",
            alt: ["Uma parábola", "Uma reta", "Uma hipérbole", "Um círculo"],
            correta: 1,
          },
        ],
        aberta:
          "Um ônibus mantém 72 km/h por 25 minutos. Qual a distância percorrida em quilômetros?",
        gabarito: "$25\\,min=\\frac{5}{12}\\,h$, então a distância é 30 km.",
      },
      {
        titulo: "Movimento uniformemente variado",
        mes: 3,
        serie: "1º ano",
        sobre: "Aceleração constante, função horária da velocidade e equação de Torricelli.",
        habilidades: "EM13CNT101, EM13CNT204",
        intro:
          "Quando a velocidade muda com taxa constante, o movimento é uniformemente variado, como na frenagem de um carro.",
        definicao:
          "No **movimento uniformemente variado**, a aceleração é constante e a velocidade varia linearmente com o tempo: $v=v_0+at$.",
        formula: "v = v_{0} + at",
        itens: [
          "A posição segue $s=s_0+v_0t+\\frac{at^2}{2}$.",
          "A equação de Torricelli liga velocidade e deslocamento sem o tempo: $v^2=v_0^2+2a\\Delta s$.",
          "Aceleração negativa indica frenagem no sentido do movimento.",
        ],
        chamada: {
          estilo: "atencao",
          texto:
            "A aceleração da gravidade próxima à superfície vale aproximadamente $9{,}8\\,m/s^2$.",
        },
        exemplo:
          "Um carro parte do repouso e atinge 20 m/s em 8 s. Qual a aceleração e a distância?",
        resolucao:
          "$a=\\frac{20}{8}=2{,}5\\,m/s^2$; $\\Delta s=\\frac{2{,}5\\cdot 8^2}{2}=80\\,m$. \\resultado{Aceleração de 2,5 m/s² e 80 m percorridos.}",
        dica: "Só use a equação de Torricelli quando o tempo não aparece no problema.",
        quiz: [
          {
            e: "Um móvel com $v_0=5\\,m/s$ e $a=3\\,m/s^2$ tem, após 4 s, velocidade de:",
            alt: ["17 m/s", "12 m/s", "20 m/s", "15 m/s"],
            correta: 0,
          },
          {
            e: "A unidade de aceleração no Sistema Internacional é:",
            alt: ["m/s", "m/s²", "km/h", "N"],
            correta: 1,
          },
        ],
        aberta: "Um trem freia de 30 m/s até parar em 150 m. Qual a aceleração de frenagem?",
        gabarito: "$v^2=v_0^2+2a\\Delta s$ dá $a=-3\\,m/s^2$.",
      },
      {
        titulo: "Leis de Newton",
        mes: 4,
        serie: "1º ano",
        sobre:
          "Inércia, princípio fundamental da dinâmica e ação e reação, com diagramas de forças.",
        habilidades: "EM13CNT101, EM13CNT301",
        intro:
          "As três leis de Newton explicam desde o repouso de um livro sobre a mesa até a propulsão de foguetes.",
        definicao:
          "A **primeira lei** afirma que um corpo permanece em repouso ou em movimento retilíneo uniforme sem força resultante; a **segunda lei** escreve $F_{r}=ma$; a **terceira lei** diz que toda ação gera uma reação de mesma intensidade e sentido oposto.",
        formula: "F_{r} = m \\cdot a",
        itens: [
          "Sem força resultante, a velocidade não muda.",
          "A massa mede a inércia do corpo.",
          "Peso é a força gravitacional: $P=mg$.",
          "Forças de ação e reação atuam em corpos diferentes.",
        ],
        chamada: {
          estilo: "diaadia",
          texto: "O cinto de segurança aumenta o tempo de frenagem e reduz a força sobre o corpo.",
        },
        exemplo:
          "Um corpo de 4 kg sofre força resultante de 12 N. Qual a aceleração? E o peso, com $g=10\\,m/s^2$?",
        resolucao:
          "$a=\\frac{12}{4}=3\\,m/s^2$; $P=4\\cdot 10=40\\,N$. \\resultado{Aceleração de 3 m/s² e peso de 40 N.}",
        figura: "Forças que atuam em um bloco apoiado sobre uma superfície horizontal.",
        dica: "Desenhe o diagrama de forças antes de aplicar a segunda lei.",
        quiz: [
          {
            e: "Um corpo em repouso permanece em repouso quando a força resultante é:",
            alt: ["Constante e não nula", "Nula", "Grande", "Variável"],
            correta: 1,
          },
          {
            e: "A terceira lei de Newton trata de:",
            alt: ["Inércia", "Ação e reação", "Aceleração centrípeta", "Energia"],
            correta: 1,
          },
        ],
        aberta: "Explique por que o peso de um astronauta muda na Lua, mas a massa não.",
        gabarito: "A massa é propriedade do corpo; o peso depende da gravidade local.",
        destaque: true,
      },
      {
        titulo: "Trabalho e energia",
        mes: 5,
        serie: "1º ano",
        sobre: "Trabalho de uma força, energia cinética, energia potencial e conservação.",
        habilidades: "EM13CNT101, EM13CNT301",
        intro:
          "Energia se transforma, e o trabalho mede a transferência de energia entre corpos por meio de forças.",
        definicao:
          "O **trabalho** de uma força constante é $W=Fd\\cos\\theta$, medido em joules. A **energia cinética** é $E_c=\\frac{mv^2}{2}$ e a **potencial gravitacional** é $E_p=mgh$.",
        formula: "W = F \\cdot d \\cdot \\cos\\theta",
        itens: [
          "Sem deslocamento, não há trabalho.",
          "Força perpendicular ao movimento não realiza trabalho.",
          "Sem atrito, a energia mecânica se conserva.",
        ],
        chamada: {
          estilo: "simbolos",
          texto: "$1\\,J=1\\,N\\cdot m=1\\,kg\\cdot m^2/s^2$.",
        },
        exemplo: "Uma força de 50 N arrasta um caixote por 6 m na mesma direção. Qual o trabalho?",
        resolucao: "$W=50\\cdot 6=300\\,J$. \\resultado{O trabalho é 300 J.}",
        dica: "Trabalho é energia em trânsito, não uma forma de energia armazenada.",
        quiz: [
          {
            e: "O trabalho de uma força perpendicular ao deslocamento é:",
            alt: ["Máximo", "Nulo", "Negativo", "Igual ao peso"],
            correta: 1,
          },
          {
            e: "A energia cinética de um corpo de 2 kg a 4 m/s é:",
            alt: ["16 J", "8 J", "32 J", "4 J"],
            correta: 0,
          },
        ],
        aberta:
          "Uma criança de 30 kg sobe uma rampa e ganha 600 J de energia potencial. Qual a altura da rampa?",
        gabarito: "$h=\\frac{E_p}{mg}=\\frac{600}{300}=2\\,m$.",
      },
      {
        titulo: "Impulso e quantidade de movimento",
        mes: 6,
        serie: "1º ano",
        sobre: "Impulso, quantidade de movimento e conservação em colisões e explosões.",
        habilidades: "EM13CNT101, EM13CNT204",
        intro:
          "A quantidade de movimento explica por que airbags e capacetes reduzem o efeito de impactos.",
        definicao:
          "A **quantidade de movimento** é $Q=mv$; o **impulso** de uma força constante é $I=F\\Delta t$ e equivale à variação da quantidade de movimento.",
        formula: "I = F \\cdot \\Delta t = \\Delta Q",
        itens: [
          "A unidade de impulso é $N\\cdot s$.",
          "Em sistema isolado, a quantidade de movimento se conserva.",
          "Aumentar o tempo de contato diminui a força média.",
        ],
        chamada: {
          estilo: "diaadia",
          texto: "O airbag estende o tempo da colisão e reduz a força sobre o ocupante.",
        },
        exemplo: "Uma força de 200 N atua por 0,05 s. Qual o impulso transmitido?",
        resolucao: "$I=200\\cdot 0{,}05=10\\,N\\cdot s$. \\resultado{O impulso é 10 N·s.}",
        dica: "Não confunda quantidade de movimento, que depende da velocidade, com energia cinética.",
        quiz: [
          {
            e: "A quantidade de movimento de um corpo de 3 kg a 5 m/s é:",
            alt: ["15 kg·m/s", "8 kg·m/s", "1,67 kg·m/s", "45 kg·m/s"],
            correta: 0,
          },
          {
            e: "Para reduzir a força de um impacto, convém:",
            alt: [
              "Diminuir o tempo de contato",
              "Aumentar o tempo de contato",
              "Aumentar a velocidade",
              "Aumentar a massa",
            ],
            correta: 1,
          },
        ],
        aberta:
          "Em uma explosão, dois fragmentos se separam. Explique como a conservação da quantidade de movimento prevê as velocidades.",
        gabarito: "A soma vetorial das quantidades de movimento permanece igual antes e depois.",
      },
      {
        titulo: "Hidrostática",
        mes: 3,
        serie: "2º ano",
        sobre: "Pressão, densidade, lei de Stevin e princípio de Arquimedes.",
        habilidades: "EM13CNT101, EM13CNT203",
        intro:
          "A hidrostática explica por que o ouvido dói no fundo da piscina e por que navios de aço flutuam.",
        definicao:
          "**Pressão** é a razão entre força e área: $p=\\frac{F}{A}$. A pressão no interior de um líquido cresce com a profundidade: $p=p_0+dgh$.",
        formula: "p = p_{0} + d \\cdot g \\cdot h",
        itens: [
          "No SI, pressão é medida em pascal.",
          "$1\\,atm\\approx 10^5\\,Pa$.",
          "O empuxo é igual ao peso do líquido deslocado.",
        ],
        chamada: {
          estilo: "simbolos",
          texto: "$E=d_{liquido}\\cdot g\\cdot V_{deslocado}$.",
        },
        exemplo: "A que pressão está um ponto a 2 m de profundidade na água, com $g=10\\,m/s^2$?",
        resolucao:
          "$p=1000\\cdot 10\\cdot 2=20000\\,Pa$ além da pressão atmosférica. \\resultado{Pressão manométrica de 20.000 Pa.}",
        dica: "A pressão depende da profundidade, e não do formato do recipiente.",
        quiz: [
          {
            e: "A pressão de uma força de 100 N sobre 2 m² é:",
            alt: ["50 Pa", "200 Pa", "100 Pa", "0,5 Pa"],
            correta: 0,
          },
          {
            e: "Um corpo flutua quando o empuxo:",
            alt: ["É menor que o peso", "Iguala o peso", "É nulo", "É maior que a massa"],
            correta: 1,
          },
        ],
        aberta:
          "Explique por que um navio de aço flutua enquanto uma barra maciça do mesmo material afunda.",
        gabarito: "O navio desloca grande volume de água, gerando empuxo suficiente.",
      },
      {
        titulo: "Calorimetria",
        mes: 4,
        serie: "2º ano",
        sobre: "Calor sensível, calor latente e equilíbrio térmico em misturas.",
        habilidades: "EM13CNT101, EM13CNT203",
        intro:
          "Calor é energia térmica em trânsito, e a calorimetria calcula quanto calor um corpo ganha ou perde.",
        definicao:
          "O **calor sensível** muda a temperatura: $Q=mc\\Delta T$. O **calor latente** muda o estado físico sem variar a temperatura: $Q=mL$.",
        formula: "Q = m \\cdot c \\cdot \\Delta T",
        itens: [
          "O calor específico da água é $1\\,cal/(g\\cdot °C)$.",
          "Em um sistema isolado, o calor cedido é igual ao recebido.",
          "Durante a fusão, a temperatura permanece constante.",
        ],
        chamada: {
          estilo: "diaadia",
          texto:
            "A areia da praia esquenta mais rápido que a água porque tem calor específico menor.",
        },
        exemplo: "Qual o calor para aquecer 200 g de água de 20 °C a 60 °C?",
        resolucao: "$Q=200\\cdot 1\\cdot 40=8000\\,cal$. \\resultado{São 8.000 calorias.}",
        dica: "Use a diferença de temperatura em módulo e indique se o calor foi cedido ou recebido.",
        quiz: [
          {
            e: "Durante a fusão do gelo, a temperatura:",
            alt: ["Aumenta", "Permanece constante", "Diminui", "Oscila"],
            correta: 1,
          },
          {
            e: "O calor específico mede:",
            alt: [
              "A energia para mudar o estado",
              "A energia por grama e por grau",
              "A temperatura máxima",
              "A massa do corpo",
            ],
            correta: 1,
          },
        ],
        aberta:
          "Explique por que o vapor de água a 100 °C causa queimaduras mais graves que a água a 100 °C.",
        gabarito: "O vapor libera o calor latente de condensação ao tocar a pele.",
      },
      {
        titulo: "Gases ideais",
        mes: 5,
        serie: "2º ano",
        sobre: "Transformações gasosas, equação de Clapeyron e leitura de gráficos.",
        habilidades: "EM13CNT101, EM13CNT203",
        intro:
          "O modelo de gás ideal relaciona pressão, volume e temperatura e explica o funcionamento de pneus e panelas de pressão.",
        definicao:
          "A **equação de Clapeyron** reúne as leis dos gases: $pV=nRT$, com $R=8{,}31\\,J/(mol\\cdot K)$.",
        formula: "p \\cdot V = n \\cdot R \\cdot T",
        itens: [
          "Transformação isotérmica: $pV$ constante.",
          "Transformação isobárica: $\\frac{V}{T}$ constante.",
          "Transformação isocórica: $\\frac{p}{T}$ constante.",
        ],
        chamada: {
          estilo: "atencao",
          texto: "A temperatura nas leis dos gases é sempre medida em kelvin.",
        },
        exemplo: "Um gás a 300 K ocupa 2 L. Sob pressão constante, qual o volume a 450 K?",
        resolucao:
          "$\\frac{V_1}{T_1}=\\frac{V_2}{T_2}$ dá $V_2=\\frac{2\\cdot 450}{300}=3\\,L$. \\resultado{O volume passa a 3 L.}",
        dica: "Some 273 à temperatura em graus Celsius antes de usar as fórmulas.",
        quiz: [
          {
            e: "Em uma transformação isotérmica, o que permanece constante?",
            alt: ["Pressão", "Volume", "Temperatura", "Massa"],
            correta: 2,
          },
          {
            e: "300 K correspondem, em graus Celsius, a aproximadamente:",
            alt: ["27 °C", "300 °C", "573 °C", "0 °C"],
            correta: 0,
          },
        ],
        aberta: "Explique por que um pneu não deve ser calibrado logo após uma viagem longa.",
        gabarito: "O ar aquecido tem pressão maior; a medida seria superestimada.",
      },
      {
        titulo: "Lei de Coulomb",
        mes: 3,
        serie: "3º ano",
        sobre: "Cargas elétricas, força entre cargas e campo elétrico.",
        habilidades: "EM13CNT101, EM13CNT205",
        intro:
          "A eletrostática estuda cargas em repouso e a força que elas trocam, base de toda a eletricidade.",
        definicao:
          "A **lei de Coulomb** afirma que a força entre duas cargas é proporcional ao produto das cargas e inversamente proporcional ao quadrado da distância.",
        formula: "F = k \\cdot \\frac{|q_{1} \\cdot q_{2}|}{d^{2}}",
        itens: [
          "Cargas de sinais iguais se repelem.",
          "Cargas de sinais opostos se atraem.",
          "$k=9\\cdot 10^9\\,N\\cdot m^2/C^2$ no vácuo.",
        ],
        chamada: {
          estilo: "simbolos",
          texto: "A força é um vetor: importa o módulo, a direção e o sentido.",
        },
        exemplo: "Duas cargas de $2\\,\\mu C$ estão a 0,1 m uma da outra. Qual a força entre elas?",
        resolucao:
          "$F=9\\cdot 10^9\\cdot\\frac{(2\\cdot 10^{-6})^2}{0{,}1^2}=3{,}6\\,N$. \\resultado{A força é de 3,6 N, repulsiva.}",
        dica: "Use o módulo das cargas no cálculo e defina o sentido pela regra dos sinais.",
        quiz: [
          {
            e: "Duas cargas positivas, próximas, exercem entre si:",
            alt: ["Atração", "Repulsão", "Força nula", "Força magnética"],
            correta: 1,
          },
          {
            e: "Se a distância entre duas cargas dobra, a força elétrica:",
            alt: ["Dobra", "Fica quatro vezes maior", "Fica quatro vezes menor", "Não muda"],
            correta: 2,
          },
        ],
        aberta:
          "Explique o que acontece com a força entre duas cargas se uma delas for descarregada pela metade.",
        gabarito: "A força também cai pela metade, pois é proporcional ao produto das cargas.",
      },
      {
        titulo: "Lei de Ohm e circuitos simples",
        mes: 4,
        serie: "3º ano",
        sobre: "Corrente, tensão, resistência e associação de resistores em série e em paralelo.",
        habilidades: "EM13CNT101, EM13CNT205",
        intro:
          "A lei de Ohm relaciona tensão, corrente e resistência e permite prever o consumo de aparelhos elétricos.",
        definicao:
          "A **primeira lei de Ohm** afirma que a tensão é o produto da resistência pela corrente: $U=Ri$. A **potência** dissipada é $P=Ui$.",
        formula: "U = R \\cdot i",
        itens: [
          "Em série, a corrente é a mesma e as tensões se somam.",
          "Em paralelo, a tensão é a mesma e as correntes se somam.",
          "A unidade de resistência é o ohm.",
        ],
        chamada: {
          estilo: "diaadia",
          texto: "O chuveiro ligado na potência máxima consome mais corrente e esquenta mais.",
        },
        exemplo: "Um resistor de 20 Ω sob 12 V. Qual a corrente e a potência?",
        resolucao:
          "$i=\\frac{12}{20}=0{,}6\\,A$; $P=12\\cdot 0{,}6=7{,}2\\,W$. \\resultado{Corrente de 0,6 A e potência de 7,2 W.}",
        dica: "Confira se os resistores estão em série ou em paralelo antes de somar.",
        quiz: [
          {
            e: "Em uma associação em série, o que é igual em todos os resistores?",
            alt: ["A tensão", "A corrente", "A potência", "A resistência"],
            correta: 1,
          },
          {
            e: "Um aparelho de 220 V que consome 5 A tem potência de:",
            alt: ["44 W", "1100 W", "225 W", "440 W"],
            correta: 1,
          },
        ],
        aberta: "Explique por que as tomadas de uma casa ficam em paralelo e não em série.",
        gabarito:
          "Em paralelo, cada aparelho recebe a mesma tensão e funciona de forma independente.",
      },
      {
        titulo: "Ondas e som",
        mes: 8,
        serie: "2º ano",
        sobre: "Comprimento de onda, frequência, velocidade de propagação e qualidades do som.",
        habilidades: "EM13CNT101, EM13CNT302",
        intro:
          "Ondas transportam energia sem transportar matéria, e o som é uma onda mecânica que precisa de meio material.",
        definicao:
          "A **velocidade** de uma onda é o produto do comprimento de onda pela frequência: $v=\\lambda f$. O som se propaga no ar a cerca de $340\\,m/s$.",
        formula: "v = \\lambda \\cdot f",
        itens: [
          "A frequência é medida em hertz.",
          "Altura, intensidade e timbre são qualidades do som.",
          "O som não se propaga no vácuo.",
        ],
        chamada: {
          estilo: "diaadia",
          texto:
            "O eco é o som refletido que retorna ao ouvido depois de um intervalo perceptível.",
        },
        exemplo: "Qual o comprimento de onda de um som de 170 Hz no ar?",
        resolucao: "$\\lambda=\\frac{340}{170}=2\\,m$. \\resultado{O comprimento de onda é 2 m.}",
        figura: "Faixas de frequência do som audível, do infrassom ao ultrassom.",
        dica: "Frequência alta corresponde a som agudo, e não a som mais rápido.",
        quiz: [
          {
            e: "O som é uma onda:",
            alt: ["Eletromagnética", "Mecânica", "Luminosa", "Estática"],
            correta: 1,
          },
          {
            e: "Uma onda de 2 m de comprimento e 50 Hz tem velocidade de:",
            alt: ["100 m/s", "25 m/s", "52 m/s", "0,04 m/s"],
            correta: 0,
          },
        ],
        aberta: "Explique por que o som não se propaga no vácuo do espaço.",
        gabarito: "O som precisa de meio material para vibrar e transportar energia.",
      },
    ],
  },
  {
    chave: "quimica",
    professor: "marcos",
    nome: "Química",
    cor: "ambar",
    icone: "FlaskConical",
    ordem: 1,
    aulas: [
      {
        titulo: "Modelos atômicos",
        mes: 2,
        serie: "1º ano",
        sobre:
          "Evolução dos modelos atômicos, de Dalton a Bohr, com as evidências de cada proposta.",
        habilidades: "EM13CNT201, EM13CNT301",
        intro:
          "Os modelos atômicos mudaram conforme novos experimentos revelaram os limites das propostas anteriores.",
        definicao:
          "O **modelo de Dalton** tratava o átomo como esfera maciça e indivisível; o de **Thomson** propôs cargas negativas imersas em uma massa positiva; o de **Rutherford** concentrou massa e carga positiva no núcleo; o de **Bohr** organizou os elétrons em níveis de energia.",
        itens: [
          "Dalton: esfera maciça.",
          "Thomson: cargas negativas em massa positiva.",
          "Rutherford: núcleo pequeno e denso.",
          "Bohr: níveis quantizados de energia.",
        ],
        chamada: {
          estilo: "simbolos",
          texto: "O número atômico $Z$ é o número de prótons; o número de massa $A$ é $Z+N$.",
        },
        exemplo: "Um átomo tem $Z=11$ e $A=23$. Quantos prótons, nêutrons e elétrons possui?",
        resolucao:
          "Prótons: 11; nêutrons: $23-11=12$; elétrons: 11 no estado neutro. \\resultado{11 prótons, 12 nêutrons e 11 elétrons.}",
        dica: "Em um átomo neutro, o número de elétrons é igual ao de prótons.",
        quiz: [
          {
            e: "Qual modelo introduziu os níveis de energia?",
            alt: ["Dalton", "Thomson", "Rutherford", "Bohr"],
            correta: 3,
          },
          {
            e: "O número de massa $A$ corresponde a:",
            alt: ["Prótons apenas", "Prótons e nêutrons", "Elétrons e prótons", "Nêutrons apenas"],
            correta: 1,
          },
        ],
        aberta: "Explique qual experimento levou Rutherford a propor um núcleo pequeno e denso.",
        gabarito:
          "O espalhamento de partículas alfa mostrou que poucas eram desviadas, indicando núcleo pequeno e positivo.",
      },
      {
        titulo: "Tabela periódica e propriedades",
        mes: 3,
        serie: "1º ano",
        sobre: "Organização da tabela periódica, famílias, períodos e propriedades periódicas.",
        habilidades: "EM13CNT201, EM13CNT301",
        intro:
          "A tabela periódica organiza os elementos de modo que posição e comportamento químico caminham juntos.",
        definicao:
          "A **tabela periódica** ordena os elementos pelo número atômico e agrupa comportamentos semelhantes em famílias e períodos.",
        itens: [
          "Metais: condutores, brilhantes e maleáveis.",
          "Ametais: maus condutores de calor e eletricidade.",
          "Gases nobres: baixa reatividade química.",
          "Famílias: grupos com propriedades parecidas.",
        ],
        chamada: {
          estilo: "diaadia",
          texto: "O sódio e o cloro formam o sal de cozinha; isolados, são substâncias perigosas.",
        },
        exemplo: "Por que o raio atômico diminui ao longo de um período e aumenta em uma família?",
        resolucao:
          "No período, a carga nuclear cresce e atrai mais os elétrons; na família, aumentam as camadas eletrônicas. \\resultado{O raio cai no período e cresce na família.}",
        dica: "Metais alcalinos reagem violentamente com água; o manuseio exige proteção adequada.",
        quiz: [
          {
            e: "Os elementos de uma mesma família apresentam:",
            alt: [
              "Mesmo número de massa",
              "Propriedades químicas semelhantes",
              "Mesmo número de nêutrons",
              "Mesma cor",
            ],
            correta: 1,
          },
          {
            e: "Qual grupo reúne os gases nobres?",
            alt: ["Família 1", "Família 2", "Família 17", "Família 18"],
            correta: 3,
          },
        ],
        aberta: "Justifique a posição dos metais alcalinos na família 1 da tabela periódica.",
        gabarito: "Todos têm um elétron na camada de valência e tendem a perdê-lo.",
      },
      {
        titulo: "Ligações químicas",
        mes: 4,
        serie: "1º ano",
        sobre:
          "Ligações iônica, covalente e metálica, com polaridade e propriedades dos compostos.",
        habilidades: "EM13CNT201, EM13CNT301",
        intro:
          "As ligações químicas explicam por que o sal conduz corrente quando dissolvido e por que os metais conduzem sempre.",
        definicao:
          "A **ligação iônica** ocorre pela transferência de elétrons entre metal e ametal; a **covalente**, pelo compartilhamento entre ametais; a **metálica**, pela nuvem de elétrons livres.",
        formula: "\\ce{Na+ + Cl- -> NaCl}",
        itens: [
          "Iônica: atração entre íons de cargas opostas.",
          "Covalente: compartilhamento de pares de elétrons.",
          "Metálica: elétrons livres e condutividade.",
          "A polaridade depende da diferença de eletronegatividade.",
        ],
        chamada: {
          estilo: "simbolos",
          texto:
            "A eletronegatividade cresce da esquerda para a direita e de baixo para cima na tabela periódica.",
        },
        exemplo: "Classifique as ligações em $\\ce{NaCl}$, $\\ce{H2O}$ e $\\ce{Fe}$.",
        resolucao:
          "$\\ce{NaCl}$ é iônica, $\\ce{H2O}$ é covalente polar e $\\ce{Fe}$ tem ligação metálica. \\resultado{Três tipos de ligação nos três materiais.}",
        figura: "Formação de íons na ligação entre sódio e cloro, com transferência de elétron.",
        dica: "Compostos iônicos conduzem corrente quando dissolvidos ou fundidos, não no estado sólido.",
        quiz: [
          {
            e: "A ligação entre um metal e um ametal é tipicamente:",
            alt: ["Covalente apolar", "Iônica", "Metálica", "Dipolo permanente"],
            correta: 1,
          },
          {
            e: "A condutividade dos metais se explica pela:",
            alt: [
              "Transferência de prótons",
              "Nuvem de elétrons livres",
              "Rigidez da rede iônica",
              "Presença de água",
            ],
            correta: 1,
          },
        ],
        aberta: "Explique por que o sal sólido não conduz corrente, mas a solução salina conduz.",
        gabarito: "No sólido, os íons ficam fixos na rede; dissolvidos, ficam livres para migrar.",
        destaque: true,
      },
      {
        titulo: "Funções inorgânicas",
        mes: 5,
        serie: "1º ano",
        sobre: "Ácidos, bases, sais e óxidos, com pH e reações de neutralização.",
        habilidades: "EM13CNT201, EM13CNT205",
        intro:
          "As quatro funções inorgânicas aparecem em produtos de limpeza, alimentos, remédios e na chuva ácida.",
        definicao:
          "**Ácidos** liberam $\\ce{H+}$ em água; **bases** liberam $\\ce{OH-}$; **sais** resultam da neutralização entre ácido e base; **óxidos** são compostos binários com oxigênio.",
        itens: [
          "Ácidos: pH menor que 7.",
          "Bases: pH maior que 7.",
          "Sais: formados na neutralização.",
          "Óxidos: ligações com oxigênio.",
        ],
        chamada: {
          estilo: "atencao",
          texto: "O pH do estômago é ácido e o do sangue é levemente básico; o equilíbrio é vital.",
        },
        exemplo: "Complete e classifique: $\\ce{HCl + NaOH -> ? + H2O}$.",
        resolucao:
          "$\\ce{HCl + NaOH -> NaCl + H2O}$; o sal formado é o cloreto de sódio. \\resultado{Reação de neutralização com sal e água.}",
        dica: "Ácido forte não é sinônimo de ácido concentrado; força e concentração são conceitos distintos.",
        quiz: [
          {
            e: "Qual substância libera $\\ce{OH-}$ em água?",
            alt: ["Ácido", "Base", "Sal", "Óxido"],
            correta: 1,
          },
          {
            e: "A reação entre ácido e base produz:",
            alt: ["Apenas gás", "Sal e água", "Metal e oxigênio", "Somente base"],
            correta: 1,
          },
        ],
        aberta: "Explique por que a chuva ácida prejudica monumentos de mármore.",
        gabarito:
          "O ácido reage com o carbonato de cálcio do mármore e corrói a superfície da pedra.",
      },
      {
        titulo: "Balanceamento de equações",
        mes: 6,
        serie: "1º ano",
        sobre: "Lei de conservação das massas e método de balanceamento por tentativa.",
        habilidades: "EM13CNT201, EM13CNT301",
        intro:
          "Balancear uma equação química é garantir que nenhum átomo desapareça nem apareça na transformação.",
        definicao:
          "Balancear é igualar o número de átomos de cada elemento nos dois lados da equação, respeitando a **lei de conservação das massas**.",
        formula: "\\ce{2H2 + O2 -> 2H2O}",
        itens: [
          "Ajuste os coeficientes, nunca os índices.",
          "Comece pelos elementos que aparecem em menos compostos.",
          "Deixe hidrogênio e oxigênio para o fim.",
        ],
        chamada: {
          estilo: "simbolos",
          texto: "Coeficiente indica quantidade de moléculas; índice indica quantidade de átomos.",
        },
        exemplo: "Balanceie $\\ce{Fe + O2 -> Fe2O3}$.",
        resolucao:
          "$\\ce{4Fe + 3O2 -> 2Fe2O3}$. \\resultado{Quatro ferros e seis oxigênios de cada lado.}",
        dica: "Confira a contagem final elemento por elemento antes de seguir adiante.",
        quiz: [
          {
            e: "Na equação $\\ce{2H2 + O2 -> 2H2O}$, o coeficiente do oxigênio é:",
            alt: ["1", "2", "3", "4"],
            correta: 0,
          },
          {
            e: "Balancear uma equação garante:",
            alt: [
              "Mudança de massa",
              "Conservação dos átomos",
              "Formação de energia",
              "Perda de elétrons",
            ],
            correta: 1,
          },
        ],
        aberta: "Balanceie $\\ce{CH4 + O2 -> CO2 + H2O}$ e explique o método usado.",
        gabarito: "$\\ce{CH4 + 2O2 -> CO2 + 2H2O}$.",
      },
      {
        titulo: "Estequiometria",
        mes: 3,
        serie: "2º ano",
        sobre: "Relações de mol, massa e volume em reações químicas com reagente limitante.",
        habilidades: "EM13CNT201, EM13CNT301",
        intro:
          "A estequiometria calcula quanto de cada reagente é necessário e quanto de produto se forma em uma reação.",
        definicao:
          "A **estequiometria** usa as proporções da equação balanceada para relacionar quantidades de reagentes e produtos em mol, massa ou volume.",
        formula: "n = \\frac{m}{M}",
        itens: [
          "1 mol contém $6{,}02\\cdot 10^{23}$ partículas.",
          "A massa molar é a massa de 1 mol, em g/mol.",
          "As proporções vêm dos coeficientes da equação.",
        ],
        chamada: {
          estilo: "simbolos",
          texto: "Nas condições normais, 1 mol de gás ideal ocupa $22{,}4\\,L$.",
        },
        exemplo: "Quantos gramas de água se formam na queima completa de 2 mol de $\\ce{H2}$?",
        resolucao:
          "$\\ce{2H2 + O2 -> 2H2O}$; 2 mol de $\\ce{H2}$ formam 2 mol de água, ou 36 g. \\resultado{São 36 gramas de água.}",
        figura: "Proporção de massas entre reagentes e produtos em uma reação completa.",
        dica: "Converta tudo para mol antes de usar a proporção da equação.",
        quiz: [
          {
            e: "A massa molar da água ($\\ce{H2O}$) é aproximadamente:",
            alt: ["18 g/mol", "10 g/mol", "16 g/mol", "20 g/mol"],
            correta: 0,
          },
          {
            e: "O número de Avogadro indica:",
            alt: [
              "A massa de 1 mol",
              "As partículas em 1 mol",
              "O volume de 1 g",
              "A densidade dos gases",
            ],
            correta: 1,
          },
        ],
        aberta:
          "Quantos mols de $\\ce{CO2}$ são produzidos na queima de 3 mol de metano, conforme $\\ce{CH4 + 2O2 -> CO2 + 2H2O}$?",
        gabarito: "A proporção é de 1 para 1, portanto 3 mol de gás carbônico.",
      },
      {
        titulo: "Soluções e concentração",
        mes: 4,
        serie: "2º ano",
        sobre: "Concentração comum, molaridade, diluição e unidades de concentração.",
        habilidades: "EM13CNT201, EM13CNT205",
        intro:
          "Soluções estão em soro, refrigerantes, combustíveis e produtos de limpeza; a concentração mede quanto soluto há na mistura.",
        definicao:
          "**Concentração comum** é a massa de soluto por volume de solução: $C=\\frac{m}{V}$. **Molaridade** é o número de mols por litro: $M=\\frac{n}{V}$.",
        formula: "C = \\frac{m}{V}",
        itens: [
          "Soluto, solvente e solução têm papéis distintos.",
          "A diluição conserva a quantidade de soluto.",
          "Em diluições vale $C_1V_1=C_2V_2$.",
          "Traços usam partes por milhão.",
        ],
        chamada: {
          estilo: "diaadia",
          texto: "O soro fisiológico tem concentração de 0,9 por cento de cloreto de sódio.",
        },
        exemplo: "Qual a concentração de uma solução com 20 g de sal em 500 mL?",
        resolucao: "$C=\\frac{20}{0{,}5}=40\\,g/L$. \\resultado{A concentração é 40 g/L.}",
        dica: "O volume da solução, e não o do solvente, entra no denominador.",
        quiz: [
          {
            e: "Ao diluir uma solução com água, a quantidade de soluto:",
            alt: ["Aumenta", "Diminui", "Permanece igual", "Zera"],
            correta: 2,
          },
          {
            e: "40 g de soluto em 2 L resultam em concentração de:",
            alt: ["20 g/L", "80 g/L", "40 g/L", "2 g/L"],
            correta: 0,
          },
        ],
        aberta:
          "Explique como preparar 250 mL de solução a 0,2 mol/L a partir de uma solução estoque de 1 mol/L.",
        gabarito: "Usar 50 mL da solução estoque e completar o volume com água até 250 mL.",
      },
      {
        titulo: "Termoquímica",
        mes: 5,
        serie: "2º ano",
        sobre: "Entalpia, reações exotérmicas e endotérmicas e gráficos de energia.",
        habilidades: "EM13CNT201, EM13CNT301",
        intro:
          "Toda reação troca energia com o ambiente, e a termoquímica mede essa troca na forma de calor.",
        definicao:
          "Reações que liberam calor são **exotérmicas** e têm variação de entalpia negativa; as que absorvem calor são **endotérmicas**, com variação positiva.",
        formula: "\\Delta H = H_{produtos} - H_{reagentes}",
        itens: [
          "Combustão é exotérmica.",
          "Fotossíntese é endotérmica.",
          "A entalpia mede energia armazenada nas ligações.",
          "Gráficos de energia mostram o salto entre reagentes e produtos.",
        ],
        chamada: {
          estilo: "atencao",
          texto: "A variação de entalpia depende das condições de pressão e temperatura.",
        },
        exemplo:
          "A combustão do metano libera 890 kJ por mol. Classifique a reação e indique o sinal de $\\Delta H$.",
        resolucao:
          "Como libera calor, é exotérmica e $\\Delta H=-890\\,kJ/mol$. \\resultado{Reação exotérmica com entalpia negativa.}",
        dica: "Sinal negativo significa energia liberada para o ambiente.",
        quiz: [
          {
            e: "Uma reação endotérmica:",
            alt: ["Libera calor", "Absorve calor", "Não troca energia", "Sempre explode"],
            correta: 1,
          },
          {
            e: "Na combustão, o $\\Delta H$ costuma ser:",
            alt: ["Positivo", "Negativo", "Nulo", "Indefinido"],
            correta: 1,
          },
        ],
        aberta: "Explique por que a fotossíntese é uma reação endotérmica.",
        gabarito:
          "Ela absorve energia luminosa para formar glicose a partir de gás carbônico e água.",
      },
      {
        titulo: "Cinética química",
        mes: 6,
        serie: "2º ano",
        sobre:
          "Velocidade das reações e efeito de temperatura, concentração, superfície e catalisador.",
        habilidades: "EM13CNT201, EM13CNT301",
        intro:
          "A cinética estuda a rapidez das transformações e os fatores que a alteram no laboratório e na indústria.",
        definicao:
          "A **cinética química** estuda a velocidade das reações e os fatores que a alteram: concentração, temperatura, superfície de contato e catalisadores.",
        itens: [
          "Mais temperatura significa mais colisões eficazes.",
          "Catalisador reduz a energia de ativação.",
          "Superfície de contato maior acelera reações heterogêneas.",
          "Inibidor diminui a velocidade.",
        ],
        chamada: {
          estilo: "diaadia",
          texto:
            "Alimentos refrigerados estragam mais devagar porque a temperatura baixa reduz a velocidade das reações.",
        },
        exemplo: "Por que comprimidos efervescentes reagem mais rápido quando pulverizados?",
        resolucao:
          "A pulverização aumenta a superfície de contato com a água e eleva a frequência de colisões. \\resultado{Maior superfície, maior velocidade.}",
        dica: "Catalisador não altera o resultado da reação, apenas o caminho até ele.",
        quiz: [
          {
            e: "Qual fator aumenta a velocidade da reação entre sólido e líquido?",
            alt: [
              "Reduzir a superfície de contato",
              "Aumentar a temperatura",
              "Adicionar inibidor",
              "Diminuir a concentração",
            ],
            correta: 1,
          },
          {
            e: "O catalisador atua:",
            alt: [
              "Aumentando a energia de ativação",
              "Reduzindo a energia de ativação",
              "Mudando os produtos",
              "Consumindo-se na reação",
            ],
            correta: 1,
          },
        ],
        aberta: "Explique por que a carne conservada no congelador demora mais para estragar.",
        gabarito: "A baixa temperatura reduz a velocidade das reações de decomposição.",
      },
      {
        titulo: "Equilíbrio químico",
        mes: 3,
        serie: "3º ano",
        sobre: "Equilíbrio dinâmico, constante de equilíbrio e princípio de Le Chatelier.",
        habilidades: "EM13CNT201, EM13CNT301",
        intro:
          "Muitas reações não se completam: elas chegam a um estado dinâmico em que formação e decomposição ocorrem na mesma velocidade.",
        definicao:
          "O **equilíbrio químico** ocorre quando as velocidades das reações direta e inversa se igualam e as concentrações permanecem constantes.",
        formula: "K_{c} = \\frac{[produtos]}{[reagentes]}",
        itens: [
          "O equilíbrio é dinâmico.",
          "A constante depende da temperatura.",
          "Le Chatelier prevê deslocamentos.",
          "Catalisador não desloca o equilíbrio.",
        ],
        chamada: {
          estilo: "simbolos",
          texto: "Em $K_c$, cada concentração é elevada ao coeficiente da equação balanceada.",
        },
        exemplo:
          "O que acontece com o equilíbrio $\\ce{N2 + 3H2 <=> 2NH3}$ quando a pressão aumenta?",
        resolucao:
          "O sistema se desloca para o lado com menos mols de gás e forma mais amônia. \\resultado{O equilíbrio favorece a formação de $\\ce{NH3}$.}",
        dica: "Aumentar a pressão favorece o lado com menor volume gasoso.",
        quiz: [
          {
            e: "No equilíbrio químico, as concentrações:",
            alt: ["Zeram", "Permanecem constantes", "Crescem sem limite", "Variam sempre"],
            correta: 1,
          },
          {
            e: "Segundo Le Chatelier, adicionar reagente desloca o equilíbrio:",
            alt: ["Para os reagentes", "Para os produtos", "Não desloca", "Para o catalisador"],
            correta: 1,
          },
        ],
        aberta: "Explique por que um catalisador não altera a constante de equilíbrio.",
        gabarito:
          "Ele acelera as duas reações na mesma proporção e não muda as concentrações finais.",
      },
      {
        titulo: "Eletroquímica: pilhas",
        mes: 4,
        serie: "3º ano",
        sobre: "Oxirredução, pilhas, potencial padrão e diferença entre pilha e eletrólise.",
        habilidades: "EM13CNT201, EM13CNT205",
        intro:
          "As pilhas convertem energia química em energia elétrica e movem desde controles remotos até carros elétricos.",
        definicao:
          "Uma **pilha** converte energia química em elétrica por meio de reações de oxirredução espontâneas, com ânodo e cátodo separados.",
        formula: "\\Delta E^{0} = E^{0}_{cátodo} - E^{0}_{ânodo}",
        itens: [
          "Ânodo: oxidação e perda de elétrons.",
          "Cátodo: redução e ganho de elétrons.",
          "Ponte salina fecha o circuito iônico.",
          "Potencial positivo indica reação espontânea.",
        ],
        chamada: {
          estilo: "diaadia",
          texto: "A bateria do celular é uma pilha recarregável, que inverte o fluxo na recarga.",
        },
        exemplo:
          "Uma pilha tem $E^0_{cátodo}=+0{,}34\\,V$ e $E^0_{ânodo}=-0{,}76\\,V$. Qual a força eletromotriz?",
        resolucao:
          "$\\Delta E^0=0{,}34-(-0{,}76)=1{,}10\\,V$. \\resultado{A pilha fornece 1,10 V.}",
        dica: "O ânodo é o polo negativo na pilha, mas o polo positivo na eletrólise.",
        quiz: [
          {
            e: "Na pilha, a oxidação ocorre no:",
            alt: ["Cátodo", "Ânodo", "Eletrólito", "Voltímetro"],
            correta: 1,
          },
          {
            e: "A ponte salina serve para:",
            alt: [
              "Gerar elétrons",
              "Fechar o circuito iônico",
              "Aumentar a tensão",
              "Esquentar a solução",
            ],
            correta: 1,
          },
        ],
        aberta: "Explique a diferença entre pilha e eletrólise quanto à espontaneidade.",
        gabarito: "A pilha é espontânea e gera corrente; a eletrólise exige fonte externa.",
      },
    ],
  },
  {
    chave: "biologia",
    professor: "marcos",
    nome: "Biologia",
    cor: "lima",
    icone: "Dna",
    ordem: 2,
    aulas: [
      {
        titulo: "Membrana plasmática e transporte",
        mes: 2,
        serie: "1º ano",
        sobre: "Estrutura da membrana, transporte passivo, osmose e transporte ativo.",
        habilidades: "EM13CNT202, EM13CNT301",
        intro:
          "A membrana plasmática controla o que entra e o que sai da célula, mantendo o meio interno em equilíbrio.",
        definicao:
          "A **membrana plasmática** é um mosaico fluido de fosfolipídios e proteínas que controla a entrada e a saída de substâncias.",
        itens: [
          "Difusão simples: a favor do gradiente.",
          "Difusão facilitada: usa proteínas carreadoras.",
          "Osmose: passagem de água pelo gradiente.",
          "Transporte ativo: gasta ATP.",
        ],
        chamada: {
          estilo: "simbolos",
          texto: "Meios hipotônico, isotônico e hipertônico definem a direção da osmose.",
        },
        exemplo: "Por que uma célula animal murcha em solução hipertônica?",
        resolucao:
          "A água sai da célula por osmose e o volume diminui. \\resultado{Perda de água para o meio mais concentrado.}",
        dica: "A água se move do meio menos concentrado em soluto para o mais concentrado.",
        quiz: [
          {
            e: "O transporte que gasta energia é o:",
            alt: ["Passivo", "Ativo", "Osmose", "Difusão"],
            correta: 1,
          },
          {
            e: "A osmose é a passagem de:",
            alt: ["Solutos", "Água", "Proteínas", "Sais apenas"],
            correta: 1,
          },
        ],
        aberta: "Explique por que a membrana é descrita como mosaico fluido.",
        gabarito:
          "As proteínas ficam inseridas em uma camada fluida de fosfolipídios que se movimentam.",
      },
      {
        titulo: "Organelas e metabolismo celular",
        mes: 3,
        serie: "1º ano",
        sobre: "Funções das principais organelas e integração do metabolismo energético.",
        habilidades: "EM13CNT202, EM13CNT301",
        intro:
          "Cada organela cumpre uma etapa do trabalho celular, da produção de energia à secreção de substâncias.",
        definicao:
          "Cada organela tem função própria: a **mitocôndria** realiza a respiração, o **ribossomo** sintetiza proteínas, o **retículo** produz e transporta, o **complexo de Golgi** secreta e o **lisossomo** digere.",
        itens: [
          "Mitocôndria: energia em ATP.",
          "Ribossomo: síntese de proteínas.",
          "Retículo endoplasmático: produção e transporte.",
          "Lisossomo: digestão intracelular.",
          "Cloroplasto: fotossíntese.",
        ],
        chamada: {
          estilo: "diaadia",
          texto: "Células musculares têm muitas mitocôndrias por causa da alta demanda de energia.",
        },
        exemplo: "Que organelas se destacam em uma célula que secreta muitas enzimas digestivas?",
        resolucao:
          "Retículo endoplasmático rugoso, complexo de Golgi e mitocôndrias. \\resultado{Produção, empacotamento e energia.}",
        dica: "Compare as organelas com setores de uma fábrica para memorizar as funções.",
        quiz: [
          {
            e: "A organela responsável pela respiração celular é:",
            alt: ["Ribossomo", "Mitocôndria", "Lisossomo", "Golgi"],
            correta: 1,
          },
          {
            e: "Os ribossomos atuam na:",
            alt: ["Síntese de proteínas", "Digestão", "Fotossíntese", "Respiração"],
            correta: 0,
          },
        ],
        aberta:
          "Justifique por que os cloroplastos existem em células vegetais e não em células animais.",
        gabarito: "Somente vegetais realizam fotossíntese, processo que ocorre nos cloroplastos.",
      },
      {
        titulo: "Divisão celular: mitose e meiose",
        mes: 4,
        serie: "1º ano",
        sobre: "Fases da mitose e da meiose, variabilidade genética e erros de divisão.",
        habilidades: "EM13CNT202, EM13CNT301",
        intro: "A divisão celular garante crescimento, reparo dos tecidos e formação dos gametas.",
        definicao:
          "A **mitose** produz duas células idênticas à original, com o mesmo número de cromossomos; a **meiose** produz quatro células com metade dos cromossomos e gera gametas.",
        itens: [
          "Mitose: crescimento e reparo.",
          "Meiose: formação de gametas.",
          "A meiose tem duas divisões.",
          "O crossing-over aumenta a variabilidade.",
        ],
        chamada: {
          estilo: "atencao",
          texto: "Erros na divisão celular podem originar mutações e tumores.",
        },
        exemplo:
          "Uma célula humana com 46 cromossomos passa por meiose. Quantos cromossomos têm os gametas?",
        resolucao:
          "A meiose reduz o número pela metade: 23 cromossomos. \\resultado{Gametas com 23 cromossomos.}",
        dica: "A meiose gera variabilidade; a mitose gera cópias fiéis.",
        quiz: [
          {
            e: "Qual processo gera gametas?",
            alt: ["Mitose", "Meiose", "Fotossíntese", "Osmose"],
            correta: 1,
          },
          {
            e: "A mitose produz:",
            alt: [
              "Quatro células diferentes",
              "Duas células idênticas",
              "Gametas",
              "Células sem núcleo",
            ],
            correta: 1,
          },
        ],
        aberta: "Explique a importância do crossing-over para a evolução das espécies.",
        gabarito:
          "Ele embaralha combinações gênicas e aumenta a variabilidade sobre a qual a seleção atua.",
      },
      {
        titulo: "Genética: leis de Mendel",
        mes: 3,
        serie: "2º ano",
        sobre: "Primeira e segunda leis de Mendel, quadro de Punnett e proporções esperadas.",
        habilidades: "EM13CNT203, EM13CNT301",
        intro:
          "Mendel descreveu como as características passam de uma geração para outra a partir de experimentos com ervilhas.",
        definicao:
          "A **primeira lei** afirma que cada característica é determinada por um par de fatores que se separam na formação dos gametas; a **segunda lei** trata da separação independente de dois ou mais pares de fatores.",
        itens: [
          "Genótipo é a constituição genética.",
          "Fenótipo é a característica observada.",
          "O alelo dominante se expressa em heterozigose.",
          "O recessivo se expressa apenas em homozigose.",
        ],
        chamada: {
          estilo: "simbolos",
          texto: "No cruzamento entre dois heterozigotos, a proporção fenotípica é $3:1$.",
        },
        exemplo:
          "Do cruzamento entre duas plantas $Aa$, qual a proporção esperada de descendentes?",
        resolucao:
          "Genótipos $1AA:2Aa:1aa$ e fenótipos $3$ dominantes para $1$ recessivo. \\resultado{75 por cento dominantes e 25 por cento recessivos.}",
        figura: "Proporções fenotípicas esperadas no cruzamento entre heterozigotos.",
        dica: "Use o quadro de Punnett para conferir todas as combinações possíveis.",
        quiz: [
          {
            e: "Um indivíduo $Aa$ é chamado de:",
            alt: ["Homozigoto dominante", "Heterozigoto", "Homozigoto recessivo", "Haploide"],
            correta: 1,
          },
          {
            e: "No cruzamento $Aa\\times Aa$, a fração de recessivos é:",
            alt: ["1/2", "1/4", "3/4", "1"],
            correta: 1,
          },
        ],
        aberta: "Explique por que um casal heterozigoto pode ter filhos com fenótipo recessivo.",
        gabarito: "Cada genitor transmite o alelo recessivo em parte das combinações possíveis.",
      },
      {
        titulo: "Ácidos nucleicos e síntese proteica",
        mes: 4,
        serie: "2º ano",
        sobre: "Estrutura do DNA e do RNA, transcrição, tradução e código genético.",
        habilidades: "EM13CNT203, EM13CNT301",
        intro:
          "A informação genética flui do DNA para o RNA e chega aos ribossomos, onde a proteína é montada.",
        definicao:
          "O **DNA** guarda a informação genética em bases nitrogenadas; o **RNA** leva essa informação e monta proteínas nos ribossomos.",
        itens: [
          "DNA: dupla hélice e timina.",
          "RNA: fita simples e uracila.",
          "Transcrição: do DNA para o RNA.",
          "Tradução: do RNA para a proteína.",
        ],
        chamada: {
          estilo: "simbolos",
          texto: "Cada trinca de bases, o códon, corresponde a um aminoácido.",
        },
        exemplo: "Qual a sequência de RNA transcrita do trecho de DNA $TAC-GGA$?",
        resolucao:
          "A transcrição troca T por A e A por U: $AUG-CCU$. \\resultado{Sequência de RNA: AUG-CCU.}",
        dica: "Lembre que o RNA usa uracila no lugar da timina.",
        quiz: [
          {
            e: "A base nitrogenada exclusiva do RNA é:",
            alt: ["Timina", "Uracila", "Citosina", "Guanina"],
            correta: 1,
          },
          {
            e: "A tradução ocorre nos:",
            alt: ["Núcleos", "Ribossomos", "Lisossomos", "Cloroplastos"],
            correta: 1,
          },
        ],
        aberta:
          "Explique por que uma alteração na sequência do DNA pode mudar a proteína produzida.",
        gabarito: "A trinca alterada pode trocar o aminoácido e modificar a estrutura da proteína.",
      },
      {
        titulo: "Evolução: seleção natural",
        mes: 5,
        serie: "2º ano",
        sobre: "Variabilidade, adaptação, seleção natural e especiação.",
        habilidades: "EM13CNT203, EM13CNT304",
        intro:
          "A seleção natural explica como as populações mudam ao longo das gerações conforme o ambiente favorece certas características.",
        definicao:
          "A **seleção natural** favorece os indivíduos com características mais adaptadas ao ambiente, que deixam mais descendentes.",
        itens: [
          "A variabilidade é a matéria-prima da evolução.",
          "O ambiente seleciona fenótipos.",
          "Adaptação é resultado, não intenção.",
          "Especiação ocorre com isolamento reprodutivo.",
        ],
        chamada: {
          estilo: "diaadia",
          texto: "O uso excessivo de antibióticos seleciona bactérias resistentes.",
        },
        exemplo:
          "Por que insetos resistentes a um inseticida se tornam maioria após várias gerações?",
        resolucao:
          "Os resistentes sobrevivem e se reproduzem mais, aumentando sua frequência. \\resultado{A população se torna majoritariamente resistente.}",
        dica: "Indivíduos não se adaptam por vontade própria; populações evoluem.",
        quiz: [
          {
            e: "A seleção natural atua sobre:",
            alt: ["Indivíduos", "Populações", "Células isoladas", "Órgãos"],
            correta: 1,
          },
          {
            e: "A fonte primária de variabilidade genética é:",
            alt: ["A mutação", "O ambiente", "O acaso apenas", "A alimentação"],
            correta: 0,
          },
        ],
        aberta: "Explique a frase: populações evoluem, indivíduos não.",
        gabarito:
          "As mudanças na frequência de características ocorrem entre gerações, no conjunto da população.",
      },
      {
        titulo: "Ecologia: cadeias alimentares",
        mes: 6,
        serie: "2º ano",
        sobre: "Fluxo de energia, níveis tróficos, teias alimentares e pirâmides ecológicas.",
        habilidades: "EM13CNT203, EM13CNT304",
        intro:
          "As cadeias alimentares mostram quem se alimenta de quem e como a energia atravessa o ecossistema.",
        definicao:
          "A **cadeia alimentar** liga produtores, consumidores e decompositores pelo fluxo de energia; a **teia** reúne cadeias interligadas de um ecossistema.",
        itens: [
          "Produtores: plantas, algas e cianobactérias.",
          "Consumidores: herbívoros e carnívoros.",
          "Decompositores: fungos e bactérias.",
          "A energia diminui ao longo da cadeia.",
        ],
        chamada: {
          estilo: "simbolos",
          texto:
            "Na pirâmide de energia, cerca de 10 por cento passa de um nível trófico para o seguinte.",
        },
        exemplo:
          "Em uma cadeia com mil unidades de energia nas plantas, quanto chega ao carnívoro de terceiro nível?",
        resolucao: "$1000\\to 100\\to 10\\to 1$. \\resultado{Cerca de 1 unidade de energia.}",
        figura: "Fluxo de energia entre produtores e consumidores em uma cadeia alimentar.",
        dica: "A energia flui em sentido único; a matéria cicla.",
        quiz: [
          {
            e: "Os produtores de um ecossistema são:",
            alt: ["Carnívoros", "Plantas e algas", "Fungos", "Herbívoros"],
            correta: 1,
          },
          {
            e: "A maior parte da energia se perde na cadeia como:",
            alt: ["Matéria orgânica", "Calor", "Oxigênio", "Luz"],
            correta: 1,
          },
        ],
        aberta: "Explique por que cadeias alimentares longas sustentam poucos predadores de topo.",
        gabarito: "A energia disponível cai a cada nível trófico.",
      },
      {
        titulo: "Biomas brasileiros",
        mes: 8,
        serie: "2º ano",
        sobre:
          "Amazônia, Cerrado, Mata Atlântica, Caatinga, Pampa e Pantanal, com adaptações e ameaças.",
        habilidades: "EM13CNT203, EM13CNT304",
        intro:
          "O Brasil reúne biomas muito diferentes, cada um com clima, solo e espécies próprios.",
        definicao:
          "Os **biomas brasileiros** reúnem formações como Amazônia, Cerrado, Mata Atlântica, Caatinga, Pampa e Pantanal, cada uma com clima, solo e espécies próprios.",
        itens: [
          "Amazônia: floresta equatorial úmida.",
          "Cerrado: savana com árvores retorcidas.",
          "Caatinga: vegetação xerófila e sazonal.",
          "Pantanal: planície alagável.",
        ],
        chamada: {
          estilo: "atencao",
          texto: "O desmatamento reduz a biodiversidade e altera o regime de chuvas.",
        },
        exemplo: "Que adaptações permitem à vegetação da Caatinga sobreviver à seca?",
        resolucao:
          "Folhas reduzidas, espinhos, raízes profundas e queda das folhas na estiagem. \\resultado{Economia de água e resistência ao período seco.}",
        dica: "O Cerrado não é terra infértil: o solo é ácido e pobre, mas a vegetação é adaptada a ele.",
        quiz: [
          {
            e: "O bioma com maior biodiversidade do Brasil é:",
            alt: ["Caatinga", "Amazônia", "Pampa", "Pantanal"],
            correta: 1,
          },
          {
            e: "A vegetação da Caatinga é adaptada à:",
            alt: ["Umidade constante", "Seca prolongada", "Neve", "Água salgada"],
            correta: 1,
          },
        ],
        aberta:
          "Explique a relação entre o desmatamento da Amazônia e o regime de chuvas no Centro-Oeste.",
        gabarito:
          "A floresta libera vapor de água que alimenta os rios voadores e as chuvas da região.",
      },
      {
        titulo: "Sistema circulatório",
        mes: 3,
        serie: "3º ano",
        sobre: "Coração, vasos, circulação pulmonar e sistêmica e componentes do sangue.",
        habilidades: "EM13CNT202, EM13CNT301",
        intro:
          "O sistema circulatório leva oxigênio, nutrientes e hormônios a todas as células e recolhe resíduos.",
        definicao:
          "O **sistema circulatório** transporta sangue, nutrientes, gases e hormônios; o coração bombeia o sangue em dois circuitos, pulmonar e sistêmico.",
        itens: [
          "Artérias levam sangue do coração.",
          "Veias trazem sangue ao coração.",
          "Capilares fazem as trocas.",
          "Hemácias transportam oxigênio.",
        ],
        chamada: {
          estilo: "diaadia",
          texto: "A pressão alta sobrecarrega o coração e os vasos ao longo dos anos.",
        },
        exemplo: "Por que as paredes das artérias são mais espessas que as das veias?",
        resolucao:
          "As artérias recebem sangue sob pressão maior e precisam de paredes resistentes. \\resultado{Maior pressão exige parede mais espessa.}",
        dica: "Artéria não é sinônimo de sangue arterial: a artéria pulmonar leva sangue venoso.",
        quiz: [
          {
            e: "Os vasos que levam sangue do coração são:",
            alt: ["Veias", "Artérias", "Capilares", "Válvulas"],
            correta: 1,
          },
          {
            e: "As trocas gasosas ocorrem nos:",
            alt: ["Capilares", "Átrios", "Ventrículos", "Nodos"],
            correta: 0,
          },
        ],
        aberta:
          "Explique por que a circulação pulmonar passa pelos pulmões antes de voltar ao corpo.",
        gabarito: "Nos pulmões o sangue recebe oxigênio e libera gás carbônico.",
      },
      {
        titulo: "Imunologia e vacinas",
        mes: 4,
        serie: "3º ano",
        sobre: "Imunidade inata e adaptativa, anticorpos, memória imunológica e vacinação.",
        habilidades: "EM13CNT202, EM13CNT301",
        intro:
          "O sistema imune reconhece invasores e guarda memória deles, o que sustenta a vacinação.",
        definicao:
          "A **imunidade** pode ser inata, com barreiras e células de defesa, ou adaptativa, com anticorpos e células de memória.",
        itens: [
          "A vacina apresenta antígeno atenuado ou inativado.",
          "O soro fornece anticorpos prontos.",
          "A memória imunológica acelera a resposta.",
          "A imunidade de rebanho protege o coletivo.",
        ],
        chamada: {
          estilo: "simbolos",
          texto: "A resposta primária é lenta; a secundária é rápida e intensa.",
        },
        exemplo: "Por que é necessário tomar duas doses de algumas vacinas?",
        resolucao:
          "A segunda dose amplia a resposta e consolida a memória imunológica. \\resultado{Resposta secundária mais intensa e duradoura.}",
        figura: "Resposta imune primária e secundária após o contato com o antígeno.",
        dica: "Soro é tratamento imediato; vacina é prevenção.",
        quiz: [
          {
            e: "As vacinas estimulam a produção de:",
            alt: ["Antibióticos", "Células de memória", "Vitaminas", "Hormônios"],
            correta: 1,
          },
          {
            e: "O soro é indicado quando:",
            alt: [
              "Há tempo para prevenir",
              "É preciso resposta imediata",
              "A doença não existe",
              "Se quer memória longa",
            ],
            correta: 1,
          },
        ],
        aberta: "Explique como a vacinação contribui para a imunidade de rebanho.",
        gabarito: "Com muitos vacinados, o agente encontra poucos hospedeiros e a transmissão cai.",
      },
      {
        titulo: "Biotecnologia: transgênicos",
        mes: 5,
        serie: "3º ano",
        sobre: "DNA recombinante, transgenia, edição gênica e avaliação de riscos.",
        habilidades: "EM13CNT203, EM13CNT304",
        intro:
          "A biotecnologia moderna manipula o material genético para produzir alimentos, medicamentos e insumos.",
        definicao:
          "A **biotecnologia** usa organismos ou partes deles para produzir bens e serviços; os **transgênicos** recebem genes de outra espécie.",
        itens: [
          "O DNA recombinante une trechos de origens diferentes.",
          "A transgenia pode aumentar resistência e produtividade.",
          "Riscos exigem avaliação e rotulagem.",
          "A técnica CRISPR permite edição precisa de genes.",
        ],
        chamada: {
          estilo: "atencao",
          texto:
            "Toda liberação de transgênico passa por avaliação de risco ambiental e alimentar.",
        },
        exemplo: "Como a inserção do gene Bt torna a planta resistente a insetos?",
        resolucao:
          "A planta passa a produzir uma proteína tóxica para larvas específicas. \\resultado{Menos ataques de pragas e menos inseticida.}",
        dica: "Transgênico e organismo editado não são sinônimos: a edição altera genes do próprio genoma.",
        quiz: [
          {
            e: "Um organismo transgênico contém:",
            alt: ["Apenas genes próprios", "Gene de outra espécie", "Somente RNA", "Nenhum gene"],
            correta: 1,
          },
          {
            e: "A técnica que edita genes com precisão é:",
            alt: ["CRISPR", "PCR", "Eletroforese", "Destilação"],
            correta: 0,
          },
        ],
        aberta: "Cite um benefício e um risco dos transgênicos na agricultura.",
        gabarito:
          "Benefício: menor uso de inseticidas. Risco: fluxo gênico para variedades nativas.",
      },
    ],
  },
  {
    chave: "historia",
    professor: "sofia",
    nome: "História",
    cor: "laranja",
    icone: "Landmark",
    ordem: 1,
    aulas: [
      {
        titulo: "Revolução Industrial",
        mes: 2,
        serie: "2º ano",
        sobre:
          "Da manufatura à fábrica, as etapas da industrialização, a questão social e as transformações urbanas.",
        habilidades: "EM13CHS101, EM13CHS401",
        intro:
          "A Revolução Industrial mudou a forma de produzir, de trabalhar e de viver, e criou a sociedade urbana e industrial em que vivemos.",
        definicao:
          "A **Revolução Industrial** foi o conjunto de transformações técnicas e econômicas iniciado na Inglaterra no século XVIII, com a mecanização da produção e a concentração de trabalhadores nas fábricas.",
        itens: [
          "Acumulação de capital e cercamentos no campo.",
          "Máquina a vapor e uso do carvão mineral.",
          "Divisão do trabalho e produção em larga escala.",
          "Crescimento acelerado das cidades.",
        ],
        chamada: {
          estilo: "diaadia",
          texto:
            "Os horários rígidos, as jornadas longas e o trabalho por salário nascem desse período.",
        },
        exemplo:
          "Explique como os cercamentos contribuíram para a formação da mão de obra industrial na Inglaterra.",
        resolucao:
          "As terras comunais foram cercadas e os camponeses migraram para as cidades em busca de trabalho assalariado. \\resultado{Êxodo rural e oferta de trabalhadores para as fábricas.}",
        figura: "Produção industrial britânica ao longo do século XIX, em dados de exemplo.",
        dica: "A industrialização inglesa combinou recursos naturais, capital, mercado e mão de obra disponível.",
        quiz: [
          {
            e: "A Revolução Industrial começou na:",
            alt: ["França", "Inglaterra", "Alemanha", "Itália"],
            correta: 1,
          },
          {
            e: "Uma consequência social imediata da industrialização foi:",
            alt: [
              "A redução das cidades",
              "A formação do operariado urbano",
              "O fim do comércio",
              "A volta ao feudalismo",
            ],
            correta: 1,
          },
        ],
        aberta:
          "Compare as condições de trabalho nas fábricas do século XIX com as conquistas trabalhistas atuais.",
        gabarito:
          "Jornadas de 14 a 16 horas e trabalho infantil deram lugar a limites legais e direitos sociais.",
        destaque: true,
      },
      {
        titulo: "Revolução Francesa",
        mes: 3,
        serie: "2º ano",
        sobre:
          "Crise do Antigo Regime, fases da Revolução, Declaração dos Direitos e legado político.",
        habilidades: "EM13CHS101, EM13CHS501",
        intro:
          "A Revolução Francesa derrubou privilégios de sangue e espalhou os ideais de liberdade, igualdade e fraternidade.",
        definicao:
          "A **Revolução Francesa** foi o processo iniciado em 1789 que pôs fim ao Antigo Regime na França e afirmou a soberania popular e a igualdade jurídica.",
        itens: [
          "Crise financeira e má colheita agravaram a fome.",
          "Os estados gerais viraram Assembleia Nacional.",
          "A queda da Bastilha marcou o levante popular.",
          "O período do Terror radicalizou a revolução.",
        ],
        chamada: {
          estilo: "simbolos",
          texto: "Liberdade, igualdade e fraternidade resumiam o programa revolucionário.",
        },
        exemplo: "Qual foi o papel da Declaração dos Direitos do Homem e do Cidadão?",
        resolucao:
          "O documento afirmou direitos naturais, igualdade perante a lei e soberania da nação. \\resultado{Base jurídica dos direitos modernos.}",
        dica: "A Revolução não foi um episódio único: ela teve fases monárquica, republicana e imperial.",
        quiz: [
          {
            e: "A Revolução Francesa começou em:",
            alt: ["1776", "1789", "1815", "1848"],
            correta: 1,
          },
          {
            e: "O lema revolucionário era:",
            alt: [
              "Ordem e progresso",
              "Liberdade, igualdade e fraternidade",
              "Paz e terra",
              "Deus, pátria e família",
            ],
            correta: 1,
          },
        ],
        aberta:
          "Explique de que forma os ideais revolucionários influenciaram movimentos posteriores na América.",
        gabarito:
          "Inspiraram independências e constituições que adotaram soberania popular e igualdade jurídica.",
      },
      {
        titulo: "Independências na América Latina",
        mes: 4,
        serie: "2º ano",
        sobre:
          "Crise colonial, lideranças, projetos de nação e os limites sociais das independências.",
        habilidades: "EM13CHS101, EM13CHS502",
        intro:
          "As independências latino-americanas romperam com as metrópoles ibéricas, mas preservaram desigualdades profundas.",
        definicao:
          "As **independências na América Latina** foram processos do início do século XIX que encerraram o domínio colonial espanhol e português e criaram novas nações.",
        itens: [
          "A crise napoleônica abriu a oportunidade política.",
          "Criollos lideraram a maioria dos movimentos.",
          "O Brasil seguiu um caminho monárquico.",
          "A escravidão e a desigualdade permaneceram.",
        ],
        chamada: {
          estilo: "atencao",
          texto:
            "Independência política não significou cidadania plena para mulheres, indígenas e escravizados.",
        },
        exemplo: "Por que os criollos foram protagonistas das independências hispano-americanas?",
        resolucao:
          "Eles tinham riqueza e formação, mas não acesso aos altos cargos coloniais. \\resultado{Queriam poder político compatível com seu peso econômico.}",
        dica: "Distinga o projeto das elites do projeto popular de integração latino-americana.",
        quiz: [
          {
            e: "A independência do Brasil ocorreu em:",
            alt: ["1808", "1822", "1831", "1889"],
            correta: 1,
          },
          {
            e: "Um líder da independência sul-americana foi:",
            alt: ["Simón Bolívar", "Napoleão Bonaparte", "Otto von Bismarck", "Winston Churchill"],
            correta: 0,
          },
        ],
        aberta:
          "Explique por que as independências não eliminaram as desigualdades sociais na América Latina.",
        gabarito:
          "As elites mantiveram a propriedade da terra e as relações de trabalho herdadas da colônia.",
      },
      {
        titulo: "Imperialismo e partilha da África",
        mes: 5,
        serie: "2º ano",
        sobre:
          "Segunda Revolução Industrial, Conferência de Berlim, resistências africanas e legados do colonialismo.",
        habilidades: "EM13CHS101, EM13CHS401",
        intro:
          "No fim do século XIX, potências europeias dividiram a África e a Ásia em busca de mercados, matérias-primas e prestígio.",
        definicao:
          "O **imperialismo** foi a expansão política e econômica de potências industrializadas sobre territórios da África e da Ásia, com controle militar, administrativo e comercial.",
        itens: [
          "Busca de matérias-primas e novos mercados.",
          "Conferência de Berlim dividiu a África em 1884 e 1885.",
          "Fronteiras artificiais ignoraram povos e culturas.",
          "Houve resistência armada em várias regiões.",
        ],
        chamada: {
          estilo: "diaadia",
          texto:
            "Muitas fronteiras atuais da África foram traçadas em gabinetes europeus, sem consulta às populações.",
        },
        exemplo: "Que interesses econômicos moviam a expansão imperialista europeia?",
        resolucao:
          "A indústria precisava de matérias-primas baratas e de mercados consumidores. \\resultado{Controle de recursos e de rotas comerciais.}",
        dica: "O discurso civilizatório servia para justificar a dominação, e não para descrevê-la.",
        quiz: [
          {
            e: "A Conferência de Berlim ocorreu em:",
            alt: ["1871", "1884", "1914", "1945"],
            correta: 1,
          },
          {
            e: "O imperialismo foi impulsionado pela:",
            alt: [
              "Primeira Revolução Industrial",
              "Segunda Revolução Industrial",
              "Guerra Fria",
              "Revolução Russa",
            ],
            correta: 1,
          },
        ],
        aberta:
          "Explique como as fronteiras coloniais contribuem para conflitos atuais em países africanos.",
        gabarito:
          "A divisão artificial reuniu povos rivais e separou comunidades, gerando tensões duradouras.",
      },
      {
        titulo: "Primeira Guerra Mundial",
        mes: 2,
        serie: "3º ano",
        sobre:
          "Corrida armamentista, alianças, trincheiras, Tratado de Versalhes e consequências políticas.",
        habilidades: "EM13CHS101, EM13CHS401",
        intro:
          "A Primeira Guerra Mundial reorganizou o mapa da Europa e criou condições para novos conflitos no século XX.",
        definicao:
          "A **Primeira Guerra Mundial** foi o conflito de 1914 a 1918 entre as Potências Centrais e a Tríplice Entente, marcado pela guerra de trincheiras e pela mobilização industrial.",
        itens: [
          "Nacionalismo e corrida armamentista elevaram a tensão.",
          "O assassinato de Francisco Ferdinando foi o estopim.",
          "As trincheiras alongaram o conflito.",
          "O Tratado de Versalhes impôs duras condições à Alemanha.",
        ],
        chamada: {
          estilo: "atencao",
          texto:
            "As imposições de Versalhes alimentaram o revanchismo que ajudou a levar à Segunda Guerra.",
        },
        exemplo: "Por que a guerra começou como um conflito local e se tornou mundial?",
        resolucao:
          "O sistema de alianças obrigou as potências a entrar em apoio aos aliados. \\resultado{Uma crise regional virou guerra europeia.}",
        dica: "Estude o jogo de alianças antes de analisar as causas econômicas e nacionalistas.",
        quiz: [
          {
            e: "A Primeira Guerra Mundial ocorreu entre:",
            alt: ["1905 e 1910", "1914 e 1918", "1939 e 1945", "1899 e 1902"],
            correta: 1,
          },
          {
            e: "O tratado que encerrou o conflito foi o de:",
            alt: ["Versalhes", "Tordesilhas", "Roma", "Berlim"],
            correta: 0,
          },
        ],
        aberta:
          "Explique de que maneira a Primeira Guerra Mundial preparou o terreno para a Segunda.",
        gabarito:
          "O revanchismo alemão, as crises econômicas e os regimes autoritários se somaram ao descontentamento.",
      },
      {
        titulo: "Revolução Russa",
        mes: 3,
        serie: "3º ano",
        sobre:
          "Rússia czarista, revoluções de 1917, governo bolchevique e criação da União Soviética.",
        habilidades: "EM13CHS101, EM13CHS501",
        intro:
          "A Revolução Russa derrubou o czarismo e criou o primeiro Estado socialista, influenciando o mundo inteiro.",
        definicao:
          "A **Revolução Russa** foi o processo de 1917 que pôs fim ao Império Russo e levou os bolcheviques ao poder, com a promessa de paz, terra e pão.",
        itens: [
          "O czarismo acumulava atraso econômico e repressão.",
          "A Primeira Guerra agravou a fome e a insatisfação.",
          "A Revolução de Fevereiro derrubou o czar.",
          "A Revolução de Outubro levou os bolcheviques ao poder.",
        ],
        chamada: {
          estilo: "diaadia",
          texto: "A palavra soviético designa conselhos de trabalhadores, soldados e camponeses.",
        },
        exemplo: "Quais foram as bandeiras de Lenin e dos bolcheviques em 1917?",
        resolucao:
          "Paz imediata, terra para os camponeses e controle operário das fábricas. \\resultado{Paz, terra e pão.}",
        dica: "Não confunda a Revolução de Fevereiro, liberal, com a de Outubro, liderada pelos bolcheviques.",
        quiz: [
          {
            e: "A Revolução de Outubro foi liderada pelos:",
            alt: ["Mencheviques", "Bolcheviques", "Czaristas", "Nazistas"],
            correta: 1,
          },
          {
            e: "A União Soviética foi criada em:",
            alt: ["1917", "1922", "1939", "1945"],
            correta: 1,
          },
        ],
        aberta: "Explique como a Primeira Guerra contribuiu para a queda do czarismo.",
        gabarito:
          "As derrotas, a fome e a mortandade nas frentes de batalha minaram a legitimidade do czar.",
      },
      {
        titulo: "Era Vargas",
        mes: 4,
        serie: "3º ano",
        sobre:
          "Revolução de 1930, governo provisório, Estado Novo, legislação trabalhista e industrialização.",
        habilidades: "EM13CHS101, EM13CHS502",
        intro:
          "Getúlio Vargas centralizou o poder, modernizou o Estado e regulou o trabalho no Brasil entre 1930 e 1945.",
        definicao:
          "A **Era Vargas** foi o período de 1930 a 1945 em que Getúlio Vargas governou o Brasil, com centralização política, legislação trabalhista e incentivo à indústria.",
        itens: [
          "A Revolução de 1930 rompeu a política do café com leite.",
          "A Constituição de 1934 trouxe avanços sociais.",
          "O Estado Novo, de 1937, foi ditatorial.",
          "A CLT consolidou leis do trabalho em 1943.",
        ],
        chamada: {
          estilo: "atencao",
          texto:
            "O trabalhismo combinou conquistas sociais e controle político dos sindicatos pelo Estado.",
        },
        exemplo: "Como a CLT alterou a relação entre trabalhadores e Estado?",
        resolucao:
          "Ela garantiu direitos como férias e jornada, mas vinculou sindicatos ao Estado. \\resultado{Direitos ampliados sob tutela estatal.}",
        dica: "Observe que a Era Vargas teve fases provisória, constitucional e ditatorial.",
        quiz: [
          {
            e: "O Estado Novo foi instalado em:",
            alt: ["1930", "1934", "1937", "1945"],
            correta: 2,
          },
          {
            e: "A CLT foi criada em:",
            alt: ["1930", "1937", "1943", "1945"],
            correta: 2,
          },
        ],
        aberta:
          "Avalie a afirmação: a Era Vargas modernizou o Estado brasileiro ao custo da democracia.",
        gabarito:
          "O Estado ampliou serviços e direitos, mas concentrou poder e perseguiu opositores.",
      },
      {
        titulo: "Segunda Guerra Mundial",
        mes: 5,
        serie: "3º ano",
        sobre: "Ascensão dos regimes totalitários, fases da guerra, Holocausto e criação da ONU.",
        habilidades: "EM13CHS101, EM13CHS401",
        intro:
          "A Segunda Guerra Mundial foi o conflito mais destrutivo da história e redesenhou a ordem política mundial.",
        definicao:
          "A **Segunda Guerra Mundial** foi o conflito de 1939 a 1945 entre os Aliados e o Eixo, marcado pela ocupação de territórios, pelo genocídio e pelo uso da bomba atômica.",
        itens: [
          "O Tratado de Versalhes e a crise de 1929 favoreceram o nazismo.",
          "A invasão da Polônia iniciou a guerra.",
          "O Holocausto matou seis milhões de judeus.",
          "A ONU foi criada em 1945 para preservar a paz.",
        ],
        chamada: {
          estilo: "atencao",
          texto:
            "O Holocausto mostra a que ponto a desumanização e a propaganda podem levar uma sociedade.",
        },
        exemplo: "Por que a invasão da Polônia deu início ao conflito?",
        resolucao:
          "França e Reino Unido haviam garantido apoio à Polônia e declararam guerra à Alemanha. \\resultado{A agressão acionou as alianças europeias.}",
        dica: "Relacione a crise de 1929, o nazismo e a expansão territorial alemã.",
        quiz: [
          {
            e: "A Segunda Guerra Mundial começou em:",
            alt: ["1914", "1929", "1939", "1945"],
            correta: 2,
          },
          {
            e: "A ONU foi criada em:",
            alt: ["1919", "1939", "1945", "1950"],
            correta: 2,
          },
        ],
        aberta:
          "Explique a relação entre a crise econômica de 1929 e a ascensão dos regimes totalitários.",
        gabarito:
          "O desemprego e a instabilidade social fortaleceram discursos autoritários e nacionalistas.",
      },
      {
        titulo: "Guerra Fria",
        mes: 6,
        serie: "3º ano",
        sobre:
          "Bipolaridade, corrida armamentista e espacial, conflitos periféricos e fim da URSS.",
        habilidades: "EM13CHS101, EM13CHS401",
        intro:
          "A Guerra Fria opôs Estados Unidos e União Soviética em uma disputa global sem confronto direto entre as potências.",
        definicao:
          "A **Guerra Fria** foi a disputa política, econômica e militar entre o bloco capitalista e o bloco socialista, de 1947 a 1991, sem guerra direta entre as duas potências.",
        itens: [
          "Doutrina Truman e Plano Marshall no bloco capitalista.",
          "Cortina de ferro e Pacto de Varsóvia no bloco socialista.",
          "Corrida armamentista e espacial.",
          "Conflitos por procuração na Ásia, África e América Latina.",
        ],
        chamada: {
          estilo: "diaadia",
          texto:
            "A expressão equilíbrio do terror descreve a corrida nuclear entre as duas superpotências.",
        },
        exemplo: "Como a corrida espacial expressou a disputa entre as potências?",
        resolucao:
          "Cada conquista espacial demonstrava capacidade tecnológica e prestígio ideológico. \\resultado{A competição saiu da Terra e virou propaganda global.}",
        dica: "A Guerra Fria terminou com o colapso interno do bloco soviético, não com uma batalha final.",
        quiz: [
          {
            e: "A Guerra Fria opôs:",
            alt: [
              "Alemanha e França",
              "Estados Unidos e União Soviética",
              "Brasil e Argentina",
              "China e Japão",
            ],
            correta: 1,
          },
          {
            e: "O muro de Berlim caiu em:",
            alt: ["1961", "1979", "1989", "1991"],
            correta: 2,
          },
        ],
        aberta:
          "Explique por que a Guerra Fria não resultou em confronto militar direto entre as superpotências.",
        gabarito: "O poder nuclear tornava o confronto direto um risco de destruição mútua.",
      },
      {
        titulo: "Ditadura militar no Brasil",
        mes: 8,
        serie: "3º ano",
        sobre: "Golpe de 1964, AI-5, milagre econômico, resistências e abertura política.",
        habilidades: "EM13CHS101, EM13CHS502",
        intro:
          "O regime militar governou o Brasil de 1964 a 1985 com censura, repressão e projetos de modernização conservadora.",
        definicao:
          "A **ditadura militar no Brasil** foi o regime autoritário iniciado com o golpe de 1964, que suprimiu direitos políticos, censurou a imprensa e perseguiu opositores.",
        itens: [
          "O golpe de 1964 depôs João Goulart.",
          "O AI-5, de 1968, endureceu a repressão.",
          "O milagre econômico concentrou renda.",
          "A Lei da Anistia, de 1979, iniciou a abertura.",
        ],
        chamada: {
          estilo: "atencao",
          texto:
            "A tortura e os desaparecimentos foram práticas sistemáticas do Estado no período.",
        },
        exemplo: "O que foi o milagre econômico e qual foi o seu custo social?",
        resolucao:
          "Houve crescimento acelerado com endividamento externo e concentração de renda. \\resultado{Crescimento alto com desigualdade e inflação futura.}",
        dica: "Distinga os atos institucionais do funcionamento formal do Congresso, frequentemente fechado.",
        quiz: [
          {
            e: "O golpe militar ocorreu em:",
            alt: ["1930", "1945", "1964", "1985"],
            correta: 2,
          },
          {
            e: "O AI-5 foi decretado em:",
            alt: ["1964", "1968", "1979", "1985"],
            correta: 1,
          },
        ],
        aberta:
          "Explique de que forma a censura e a propaganda atuaram para sustentar o regime militar.",
        gabarito: "Elas controlavam a informação, exaltavam o nacionalismo e silenciavam críticas.",
      },
      {
        titulo: "Redemocratização e Constituição de 1988",
        mes: 9,
        serie: "3º ano",
        sobre:
          "Diretas Já, fim do regime, Assembleia Constituinte e os avanços da Constituição Cidadã.",
        habilidades: "EM13CHS101, EM13CHS501",
        intro:
          "A redemocratização devolveu eleições diretas e produziu a Constituição de 1988, marco dos direitos no Brasil.",
        definicao:
          "A **redemocratização** foi o processo de transição do regime militar para a democracia, com a Constituição de 1988 e a volta das eleições diretas para presidente.",
        itens: [
          "A campanha Diretas Já mobilizou o país em 1984.",
          "Tancredo Neves foi eleito indiretamente e não assumiu.",
          "A Constituinte foi eleita em 1986.",
          "A Constituição de 1988 ampliou direitos sociais e individuais.",
        ],
        chamada: {
          estilo: "simbolos",
          texto: "A Constituição de 1988 ficou conhecida como Constituição Cidadã.",
        },
        exemplo: "Quais direitos foram ampliados pela Constituição de 1988?",
        resolucao:
          "Saúde, educação, previdência, direitos trabalhistas e proteção de grupos vulneráveis. \\resultado{Um amplo catálogo de direitos sociais.}",
        dica: "A Constituição de 1988 é detalhada porque busca proteger direitos de maiorias e minorias.",
        quiz: [
          {
            e: "A campanha Diretas Já ocorreu em:",
            alt: ["1979", "1984", "1988", "1992"],
            correta: 1,
          },
          {
            e: "A Constituição Cidadã é a de:",
            alt: ["1946", "1967", "1988", "1994"],
            correta: 2,
          },
        ],
        aberta:
          "Explique por que a Constituição de 1988 é considerada um marco na história dos direitos no Brasil.",
        gabarito:
          "Ela consolidou direitos sociais e garantias fundamentais após duas décadas de autoritarismo.",
      },
    ],
  },
  {
    chave: "geografia",
    professor: "sofia",
    nome: "Geografia",
    cor: "teal",
    icone: "Globe2",
    ordem: 2,
    aulas: [
      {
        titulo: "Coordenadas geográficas e fusos horários",
        mes: 2,
        serie: "1º ano",
        sobre: "Latitude, longitude, orientação no espaço e cálculo de fusos horários.",
        habilidades: "EM13CHS106, EM13CHS301",
        intro:
          "Latitude e longitude permitem localizar qualquer ponto do planeta, e os fusos organizam os horários do mundo.",
        definicao:
          "**Latitude** é a distância angular ao Equador; **longitude** é a distância angular ao meridiano de Greenwich. Cada 15 graus de longitude correspondem a um fuso de uma hora.",
        itens: [
          "Latitude varia de 0 a 90 graus para norte ou sul.",
          "Longitude varia de 0 a 180 graus para leste ou oeste.",
          "O Brasil tem mais de um fuso horário.",
          "A linha internacional de data separa dias consecutivos.",
        ],
        chamada: {
          estilo: "diaadia",
          texto: "Um voo entre São Paulo e Tóquio cruza vários fusos e muda a data no calendário.",
        },
        exemplo: "Se em Greenwich são 12 horas, que horas são em uma cidade a 45 graus oeste?",
        resolucao:
          "$\\frac{45}{15}=3$ fusos de diferença: 9 horas. \\resultado{São 9 horas na cidade.}",
        dica: "Divida a diferença de longitude por 15 para achar a diferença de horas.",
        quiz: [
          {
            e: "A latitude é medida em relação:",
            alt: ["Ao Equador", "A Greenwich", "Ao Trópico", "Ao Polo"],
            correta: 0,
          },
          {
            e: "Cada fuso horário corresponde a:",
            alt: ["10 graus", "15 graus", "24 graus", "30 graus"],
            correta: 1,
          },
        ],
        aberta:
          "Explique por que o Brasil possui mais de um fuso horário e como isso afeta a programação nacional.",
        gabarito:
          "A extensão leste-oeste do território abrange quatro fusos, exigindo horários distintos.",
      },
      {
        titulo: "Relevo e agentes do modelado",
        mes: 3,
        serie: "1º ano",
        sobre: "Estruturas do relevo, agentes internos e externos e formas resultantes.",
        habilidades: "EM13CHS301, EM13CHS302",
        intro:
          "O relevo resulta do embate entre forças internas, que criam montanhas, e agentes externos, que esculpem a superfície.",
        definicao:
          "Os **agentes internos**, como tectonismo e vulcanismo, criam grandes formas; os **agentes externos**, como água, vento e temperatura, modelam o relevo pela erosão, transporte e sedimentação.",
        itens: [
          "Placas tectônicas explicam terremotos e dobramentos.",
          "Rios esculpem vales e planícies.",
          "Chuva e temperatura alteram rochas.",
          "O relevo brasileiro é antigo e desgastado.",
        ],
        chamada: {
          estilo: "atencao",
          texto: "Áreas de encosta com ocupação irregular concentram riscos de deslizamento.",
        },
        exemplo: "Como a água atua na formação de vales fluviais?",
        resolucao:
          "O rio erode o leito, transporta sedimentos e deposita material nas margens. \\resultado{Erosão a montante e sedimentação a jusante.}",
        dica: "Distinga a origem da forma, interna, da sua escultura posterior, externa.",
        quiz: [
          {
            e: "Um agente interno do relevo é:",
            alt: ["O vento", "A chuva", "O tectonismo", "O rio"],
            correta: 2,
          },
          {
            e: "O relevo brasileiro é predominantemente:",
            alt: ["Montanhoso e jovem", "Antigo e desgastado", "Vulcânico", "Glacial"],
            correta: 1,
          },
        ],
        aberta:
          "Explique por que as encostas ocupadas de forma irregular são áreas de risco geológico.",
        gabarito:
          "A remoção da vegetação e o corte do terreno favorecem deslizamentos em chuvas intensas.",
      },
      {
        titulo: "Clima e massas de ar",
        mes: 4,
        serie: "1º ano",
        sobre: "Elementos do clima, massas de ar, tipos climáticos do Brasil e clima urbano.",
        habilidades: "EM13CHS301, EM13CHS302",
        intro:
          "O clima resulta da interação entre latitude, altitude, massas de ar, maritimidade e vegetação.",
        definicao:
          "As **massas de ar** são grandes porções da atmosfera com características próprias de temperatura e umidade; o encontro entre elas produz frentes e mudanças de tempo.",
        itens: [
          "Massa equatorial atlântica: quente e úmida.",
          "Massa tropical atlântica: quente e úmida no litoral.",
          "Massa polar atlântica: fria e avança no inverno.",
          "Ilhas de calor alteram o clima das cidades.",
        ],
        chamada: {
          estilo: "diaadia",
          texto: "A frente fria vinda do sul derruba a temperatura e provoca chuvas no Sudeste.",
        },
        exemplo: "Por que o litoral nordestino tem chuvas concentradas em determinada época?",
        resolucao:
          "O encontro de massas úmidas com o relevo e o avanço da ZCIT concentram a chuva no período. \\resultado{Chuvas de verão e outono no litoral.}",
        figura: "Chuvas acumuladas ao longo do ano em uma cidade fictícia do litoral.",
        dica: "Tempo é o estado momentâneo da atmosfera; clima é o padrão de longa duração.",
        quiz: [
          {
            e: "O clima é definido:",
            alt: [
              "Pela temperatura de um dia",
              "Pelo padrão de longa duração",
              "Apenas pela latitude",
              "Somente pela vegetação",
            ],
            correta: 1,
          },
          {
            e: "A massa polar atlântica traz:",
            alt: ["Calor e seca", "Frio", "Umidade equatorial", "Ventos secos do deserto"],
            correta: 1,
          },
        ],
        aberta: "Explique como a urbanização pode modificar o clima local de uma metrópole.",
        gabarito:
          "Asfalto e concreto retêm calor, formam ilhas de calor e alteram chuvas e ventos.",
      },
      {
        titulo: "Biomas brasileiros",
        mes: 5,
        serie: "1º ano",
        sobre: "Distribuição dos biomas, características ambientais e pressões antrópicas.",
        habilidades: "EM13CHS301, EM13CHS304",
        intro:
          "Cada bioma brasileiro tem clima, solo, vegetação e fauna característicos e enfrenta pressões específicas.",
        definicao:
          "**Bioma** é um conjunto de ecossistemas com características semelhantes de clima, vegetação e fauna, distribuído em uma grande área.",
        itens: [
          "Amazônia: maior floresta tropical do planeta.",
          "Cerrado: savana com grande biodiversidade.",
          "Caatinga: exclusivamente brasileira.",
          "Pantanal: maior planície alagável do mundo.",
        ],
        chamada: {
          estilo: "atencao",
          texto:
            "O Cerrado e a Caatinga são biomas muito alterados e recebem menos atenção conservacionista.",
        },
        exemplo: "Por que a Caatinga é considerada um bioma exclusivamente brasileiro?",
        resolucao:
          "Suas espécies e combinações ambientais não ocorrem em outras regiões do planeta. \\resultado{Endemismo elevado e distribuição restrita ao Brasil.}",
        dica: "Não confunda bioma com domínio morfoclimático: os conceitos se sobrepõem, mas não são idênticos.",
        quiz: [
          {
            e: "O maior bioma brasileiro é:",
            alt: ["Cerrado", "Amazônia", "Mata Atlântica", "Pampa"],
            correta: 1,
          },
          {
            e: "O bioma exclusivamente brasileiro é:",
            alt: ["Caatinga", "Pantanal", "Amazônia", "Cerrado"],
            correta: 0,
          },
        ],
        aberta: "Explique por que o avanço da fronteira agrícola pressiona o Cerrado e a Amazônia.",
        gabarito:
          "A expansão de pastagens e lavouras ocupa áreas nativas e fragmenta os ecossistemas.",
      },
      {
        titulo: "Urbanização brasileira",
        mes: 3,
        serie: "2º ano",
        sobre: "Êxodo rural, metropolização, periferização e problemas urbanos.",
        habilidades: "EM13CHS302, EM13CHS403",
        intro:
          "O Brasil se tornou urbano em poucas décadas, com metrópoles concentrando população e problemas.",
        definicao:
          "A **urbanização** é o crescimento da população urbana em relação à rural, acompanhado da expansão das cidades e de novas funções econômicas.",
        itens: [
          "Industrialização acelerou o êxodo rural.",
          "Metropolização concentrou serviços e empregos.",
          "Periferização empurrou a moradia para a borda.",
          "Mobilidade e saneamento são desafios centrais.",
        ],
        chamada: {
          estilo: "diaadia",
          texto:
            "O tempo perdido no deslocamento diário é um dos custos sociais da urbanização concentrada.",
        },
        exemplo: "Explique a relação entre industrialização e crescimento das cidades brasileiras.",
        resolucao:
          "A indústria atraiu trabalhadores do campo e gerou serviços urbanos ao redor. \\resultado{Industrialização e urbanização caminharam juntas.}",
        figura: "Evolução da população urbana brasileira em dados de exemplo.",
        dica: "Urbanização não é sinônimo de crescimento populacional: ela mede a proporção urbana.",
        quiz: [
          {
            e: "O êxodo rural é:",
            alt: [
              "A saída da população do campo para a cidade",
              "A volta da população à zona rural",
              "O crescimento natural das cidades",
              "A migração entre países",
            ],
            correta: 0,
          },
          {
            e: "A periferização resulta, entre outros fatores, de:",
            alt: [
              "Preço alto da terra central",
              "Excesso de moradia vazia no centro",
              "Queda da população urbana",
              "Fim da indústria",
            ],
            correta: 0,
          },
        ],
        aberta: "Proponha duas medidas para reduzir o tempo de deslocamento nas grandes cidades.",
        gabarito: "Ampliar transporte público de alta capacidade e aproximar moradia e emprego.",
      },
      {
        titulo: "Agricultura e agronegócio",
        mes: 4,
        serie: "2º ano",
        sobre: "Sistemas agrícolas, modernização do campo, agronegócio e conflitos por terra.",
        habilidades: "EM13CHS302, EM13CHS403",
        intro:
          "O agronegócio é um dos pilares da economia brasileira e convive com a agricultura familiar e conflitos fundiários.",
        definicao:
          "O **agronegócio** reúne a produção agropecuária, os insumos, a indústria de transformação e a distribuição de produtos do campo.",
        itens: [
          "Agricultura extensiva e intensiva.",
          "Agronegócio responde por parte relevante das exportações.",
          "Agricultura familiar abastece o mercado interno.",
          "Conflitos por terra persistem no campo.",
        ],
        chamada: {
          estilo: "atencao",
          texto: "A expansão agrícola pode avançar sobre áreas nativas e comunidades tradicionais.",
        },
        exemplo: "Qual a diferença entre agricultura extensiva e intensiva?",
        resolucao:
          "A extensiva usa grandes áreas com baixa produtividade por hectare; a intensiva concentra capital e tecnologia. \\resultado{Modelos distintos de uso da terra.}",
        dica: "Agronegócio não é apenas a lavoura: inclui insumos, indústria e comércio.",
        quiz: [
          {
            e: "A agricultura familiar se caracteriza por:",
            alt: [
              "Produção em pequenas propriedades",
              "Grandes latifúndios",
              "Produção apenas para exportação",
              "Uso exclusivo de máquinas",
            ],
            correta: 0,
          },
          {
            e: "Um produto típico da pauta de exportação brasileira é:",
            alt: ["Soja", "Trigo integral", "Uva de mesa", "Cevada"],
            correta: 0,
          },
        ],
        aberta: "Explique como a modernização do campo altera a oferta de empregos no meio rural.",
        gabarito:
          "A mecanização reduz postos de trabalho e exige qualificação para operar máquinas e sistemas.",
      },
      {
        titulo: "Indústria e globalização",
        mes: 5,
        serie: "2º ano",
        sobre: "Tipos de indústria, divisão internacional do trabalho e cadeias globais.",
        habilidades: "EM13CHS302, EM13CHS404",
        intro:
          "A globalização distribui etapas produtivas pelo mundo, e o Brasil ocupa posições diferentes em cada cadeia.",
        definicao:
          "A **globalização** é a integração mundial de mercados, informações e processos produtivos, com empresas e fluxos que atravessam fronteiras.",
        itens: [
          "Indústria de base, bens intermediários e bens finais.",
          "Cadeias globais fragmentam a produção.",
          "Países centrais concentram pesquisa e comando.",
          "Blocos regionais organizam o comércio.",
        ],
        chamada: {
          estilo: "diaadia",
          texto:
            "Um celular reúne componentes projetados e produzidos em vários países antes da montagem final.",
        },
        exemplo: "Por que a indústria automobilística se distribui por vários países?",
        resolucao:
          "Custos, mercados, incentivos fiscais e logística orientam a localização de cada etapa. \\resultado{Produção fragmentada em escala global.}",
        dica: "Observe quem comanda a cadeia: a montagem pode valer menos que o projeto.",
        quiz: [
          {
            e: "A indústria de bens de capital produz:",
            alt: ["Máquinas e equipamentos", "Alimentos", "Roupas", "Cosméticos"],
            correta: 0,
          },
          {
            e: "A globalização intensificou:",
            alt: [
              "O isolamento econômico",
              "Os fluxos de mercadorias e capitais",
              "O fim do comércio",
              "A produção apenas local",
            ],
            correta: 1,
          },
        ],
        aberta:
          "Explique como a posição de um país na cadeia global afeta os salários e a renda gerada.",
        gabarito:
          "Etapas de maior valor agregado, como projeto e marca, concentram renda e salários maiores.",
      },
      {
        titulo: "Fontes de energia",
        mes: 6,
        serie: "2º ano",
        sobre: "Matriz energética, fontes renováveis e não renováveis e transição energética.",
        habilidades: "EM13CHS305, EM13CHS306",
        intro:
          "A escolha das fontes de energia afeta preços, emissões, segurança e o desenvolvimento de cada país.",
        definicao:
          "A **matriz energética** é o conjunto de fontes que abastecem o consumo de energia de um país, divididas entre renováveis e não renováveis.",
        itens: [
          "Hidrelétricas têm grande peso no Brasil.",
          "Eólica e solar crescem rapidamente.",
          "Petróleo e carvão emitem mais gases.",
          "Eficiência energética reduz a demanda.",
        ],
        chamada: {
          estilo: "simbolos",
          texto: "A matriz elétrica brasileira é mais renovável que a matriz energética total.",
        },
        exemplo: "Por que a dependência de chuvas torna a matriz hidrelétrica vulnerável?",
        resolucao:
          "Secas prolongadas reduzem o nível dos reservatórios e a capacidade de geração. \\resultado{Necessidade de fontes complementares e planejamento.}",
        figura: "Participação das fontes de energia em uma matriz elétrica fictícia.",
        dica: "Matriz energética inclui combustíveis de transporte; matriz elétrica só considera geração de eletricidade.",
        quiz: [
          {
            e: "Uma fonte renovável é:",
            alt: ["Carvão mineral", "Petróleo", "Energia eólica", "Gás natural"],
            correta: 2,
          },
          {
            e: "A principal fonte da matriz elétrica brasileira é:",
            alt: ["Nuclear", "Hidrelétrica", "Carvão", "Geotérmica"],
            correta: 1,
          },
        ],
        aberta: "Explique um benefício e um desafio da expansão da energia solar no Brasil.",
        gabarito:
          "Benefício: baixa emissão. Desafio: intermitência e necessidade de armazenamento ou complemento.",
      },
      {
        titulo: "Recursos hídricos",
        mes: 3,
        serie: "3º ano",
        sobre: "Ciclo da água, bacias hidrográficas, usos múltiplos e estresse hídrico.",
        habilidades: "EM13CHS305, EM13CHS306",
        intro: "A água doce é distribuída de forma desigual e sustenta usos que competem entre si.",
        definicao:
          "**Bacia hidrográfica** é a área drenada por um rio principal e seus afluentes; os **usos múltiplos** incluem abastecimento, irrigação, energia e navegação.",
        itens: [
          "O ciclo da água depende da vegetação e do clima.",
          "A irrigação é o maior uso consuntivo.",
          "Conflitos surgem entre usuários da mesma bacia.",
          "Poluição compromete a qualidade da água.",
        ],
        chamada: {
          estilo: "atencao",
          texto: "O desperdício e a falta de saneamento agravam a crise hídrica nas cidades.",
        },
        exemplo: "Explique o que é estresse hídrico e como ele se manifesta.",
        resolucao:
          "É a situação em que a demanda por água supera a oferta disponível na região. \\resultado{Competição entre usos e risco de desabastecimento.}",
        dica: "Uso consuntivo é aquele que reduz a água disponível; uso não consuntivo devolve quase tudo ao ciclo.",
        quiz: [
          {
            e: "O maior uso consuntivo de água no Brasil é:",
            alt: ["Irrigação", "Abastecimento urbano", "Indústria", "Navegação"],
            correta: 0,
          },
          {
            e: "Uma bacia hidrográfica é:",
            alt: [
              "Uma área drenada por um rio e seus afluentes",
              "Um reservatório artificial",
              "Um canal de irrigação",
              "Uma represa isolada",
            ],
            correta: 0,
          },
        ],
        aberta:
          "Proponha medidas para conciliar abastecimento urbano e irrigação em uma bacia com escassez.",
        gabarito:
          "Cobrança pelo uso, reúso, redução de perdas e planejamento participativo da bacia.",
      },
      {
        titulo: "Migrações",
        mes: 4,
        serie: "3º ano",
        sobre: "Tipos de migração, refúgio, migração interna e impactos sociais e econômicos.",
        habilidades: "EM13CHS201, EM13CHS402",
        intro:
          "As pessoas migram por trabalho, estudo, conflitos e desastres, e esses fluxos transformam origem e destino.",
        definicao:
          "**Migração** é o deslocamento de pessoas de um lugar para outro, podendo ser interna, internacional, voluntária ou forçada.",
        itens: [
          "Migração pendular é o vai e vem diário.",
          "Êxodo rural segue a busca por emprego e serviços.",
          "Refugiados fogem de guerras e perseguições.",
          "Remessas movimentam a economia dos países de origem.",
        ],
        chamada: {
          estilo: "diaadia",
          texto:
            "Comunidades brasileiras mantêm laços com familiares no exterior por meio de remessas e chamadas.",
        },
        exemplo: "Qual a diferença entre migrante e refugiado?",
        resolucao:
          "O refugiado foge de perseguição, guerra ou violação de direitos; o migrante pode sair por escolha. \\resultado{Proteção internacional distingue os dois casos.}",
        dica: "Distinga movimentos pendulares, sazonais e definitivos ao analisar fluxos.",
        quiz: [
          {
            e: "A migração pendular é:",
            alt: [
              "A mudança definitiva de país",
              "O deslocamento diário entre moradia e trabalho",
              "A migração de retorno",
              "O refúgio por guerra",
            ],
            correta: 1,
          },
          {
            e: "Um refugiado se desloca por:",
            alt: ["Turismo", "Perseguição ou conflito", "Estudo de curta duração", "Negócios"],
            correta: 1,
          },
        ],
        aberta: "Explique como a migração pode beneficiar e desafiar as cidades de destino.",
        gabarito:
          "Beneficia com trabalho e diversidade; desafia com moradia, serviços e integração social.",
      },
      {
        titulo: "Geopolítica e blocos econômicos",
        mes: 5,
        serie: "3º ano",
        sobre: "Ordem mundial, blocos econômicos, comércio internacional e conflitos atuais.",
        habilidades: "EM13CHS404, EM13CHS405",
        intro:
          "A ordem mundial se organiza em blocos, alianças e disputas comerciais que afetam diretamente os países.",
        definicao:
          "**Geopolítica** é o estudo das relações de poder no espaço mundial; os **blocos econômicos** são grupos de países que reduzem barreiras comerciais e coordenam políticas.",
        itens: [
          "Mercosul e União Europeia têm níveis diferentes de integração.",
          "Estados Unidos, China e União Europeia disputam influência.",
          "Sanções e tarifas afetam cadeias produtivas.",
          "Tensões regionais repercutem no comércio global.",
        ],
        chamada: {
          estilo: "simbolos",
          texto:
            "Mercado comum, união aduaneira e zona de livre comércio são graus distintos de integração.",
        },
        exemplo: "Qual a diferença entre zona de livre comércio e união aduaneira?",
        resolucao:
          "A zona elimina tarifas internas; a união aduaneira também adota tarifa externa comum. \\resultado{A união aduaneira integra mais.}",
        dica: "Observe o grau de integração: livre comércio, união aduaneira, mercado comum e união econômica.",
        quiz: [
          {
            e: "O Mercosul é um exemplo de:",
            alt: [
              "Bloco econômico",
              "Aliança militar",
              "Organização religiosa",
              "Tratado ambiental apenas",
            ],
            correta: 0,
          },
          {
            e: "Uma tarifa de importação é:",
            alt: [
              "Um imposto sobre produtos estrangeiros",
              "Um subsídio à exportação",
              "Uma taxa de câmbio",
              "Um acordo militar",
            ],
            correta: 0,
          },
        ],
        aberta:
          "Explique como as disputas comerciais entre grandes potências afetam países exportadores de commodities.",
        gabarito:
          "Tarifas e sanções alteram preços, destinos de exportação e decisões de investimento.",
      },
    ],
  },
  {
    chave: "filosofia",
    professor: "sofia",
    nome: "Filosofia",
    cor: "pedra",
    icone: "Scale",
    ordem: 3,
    aulas: [
      {
        titulo: "Sócrates e o exame da vida",
        mes: 2,
        serie: "2º ano",
        sobre: "Método socrático, ironia, maiêutica e a máxima do conhecimento de si.",
        habilidades: "EM13CHS101, EM13CHS501",
        intro:
          "Sócrates deslocou a filosofia da natureza para o ser humano e fez do diálogo um método de investigação.",
        definicao:
          "A **maiêutica** é o método socrático de perguntar e examinar respostas para conduzir o interlocutor a reconhecer os próprios limites e buscar definições consistentes.",
        itens: [
          "A ironia revela a inconsistência das opiniões.",
          "A pergunta busca definições universais.",
          "O diálogo exige reconhecer a própria ignorância.",
          "A vida examinada vale mais que a vida acomodada.",
        ],
        chamada: {
          estilo: "simbolos",
          texto: "Conhece-te a ti mesmo resume o convite socrático ao autoconhecimento.",
        },
        exemplo: "Como Sócrates conduziria uma conversa sobre o que é a justiça?",
        resolucao:
          "Ele pediria exemplos, compararia respostas e mostraria contradições até chegar a uma definição mais firme. \\resultado{Definição construída pelo diálogo, não imposta pelo mestre.}",
        dica: "A ironia socrática não é deboche: é o reconhecimento honesto da própria ignorância.",
        quiz: [
          {
            e: "A maiêutica é o método de:",
            alt: [
              "Escrever tratados longos",
              "Perguntar e examinar respostas",
              "Observar a natureza",
              "Calcular medidas",
            ],
            correta: 1,
          },
          {
            e: "Sócrates ficou conhecido por:",
            alt: [
              "Afirmar saber tudo",
              "Examinar a vida pelo diálogo",
              "Escrever livros",
              "Governar Atenas",
            ],
            correta: 1,
          },
        ],
        aberta: "Explique por que Sócrates comparava seu método ao trabalho de uma parteira.",
        gabarito:
          "Assim como a parteira ajuda a dar à luz, ele ajudava o interlocutor a gerar o próprio conhecimento.",
      },
      {
        titulo: "Platão e o mundo das ideias",
        mes: 3,
        serie: "2º ano",
        sobre: "Teoria das ideias, alegoria da caverna, conhecimento e aparência.",
        habilidades: "EM13CHS101, EM13CHS501",
        intro:
          "Platão distingue o mundo sensível, das aparências, do mundo inteligível, das ideias eternas.",
        definicao:
          "A **teoria das ideias** sustenta que as coisas sensíveis participam de formas perfeitas e eternas, acessíveis pelo pensamento e não pelos sentidos.",
        itens: [
          "O mundo sensível é mutável e imperfeito.",
          "O mundo inteligível é eterno e perfeito.",
          "A alegoria da caverna descreve a saída da ignorância.",
          "Conhecer é recordar a verdade contemplada pela razão.",
        ],
        chamada: {
          estilo: "diaadia",
          texto:
            "A alegoria da caverna inspira reflexões sobre informação, aparência e vida digital.",
        },
        exemplo: "O que representa a luz do sol na alegoria da caverna?",
        resolucao:
          "A luz representa o conhecimento verdadeiro e a dificuldade de encará-lo. \\resultado{A saída da caverna simboliza a educação pela razão.}",
        dica: "Na alegoria, as sombras são opiniões; a subida é o esforço do conhecimento.",
        quiz: [
          {
            e: "Para Platão, o conhecimento verdadeiro está no:",
            alt: ["Mundo sensível", "Mundo inteligível", "Corpo", "Discurso retórico"],
            correta: 1,
          },
          {
            e: "A alegoria da caverna trata da:",
            alt: [
              "Diferença entre aparência e verdade",
              "Origem das cidades",
              "Guerra entre poleis",
              "Arte de navegar",
            ],
            correta: 0,
          },
        ],
        aberta:
          "Relacione a alegoria da caverna com a dificuldade de mudar de opinião diante de novas evidências.",
        gabarito: "Sair da caverna exige esforço e desconforto, como rever crenças arraigadas.",
      },
      {
        titulo: "Aristóteles e a ética da virtude",
        mes: 4,
        serie: "2º ano",
        sobre: "Eudaimonia, virtudes, meio-termo e a formação do caráter pela prática.",
        habilidades: "EM13CHS101, EM13CHS502",
        intro:
          "Para Aristóteles, a vida boa se alcança pela prática constante de virtudes, e não por regras prontas.",
        definicao:
          "A **virtude** é um hábito racional que busca o meio-termo entre excesso e falta; a **eudaimonia** é a felicidade como realização plena da vida.",
        itens: [
          "A virtude se aprende praticando.",
          "O meio-termo depende da situação e da pessoa.",
          "A coragem fica entre a temeridade e a covardia.",
          "A amizade é essencial para a vida boa.",
        ],
        chamada: {
          estilo: "diaadia",
          texto:
            "A ideia de meio-termo ajuda a pensar decisões equilibradas no estudo e no trabalho.",
        },
        exemplo: "Como Aristóteles definiria a virtude da generosidade?",
        resolucao:
          "Ela fica entre a avareza e a prodigalidade, ajustada aos recursos e à necessidade. \\resultado{Meio-termo entre excesso e falta.}",
        dica: "Meio-termo não é média matemática: é a medida adequada para cada situação.",
        quiz: [
          {
            e: "Para Aristóteles, a felicidade é:",
            alt: [
              "Prazer momentâneo",
              "Realização plena da vida",
              "Acúmulo de riquezas",
              "Ausência de regras",
            ],
            correta: 1,
          },
          {
            e: "A virtude se adquire:",
            alt: ["Pelo nascimento", "Pela prática habitual", "Pela sorte", "Pela riqueza"],
            correta: 1,
          },
        ],
        aberta:
          "Explique por que, para Aristóteles, não basta saber o que é certo: é preciso agir.",
        gabarito:
          "A virtude é hábito; só a prática repetida forma o caráter e consolida a disposição.",
      },
      {
        titulo: "Descartes e a dúvida metódica",
        mes: 5,
        serie: "2º ano",
        sobre: "Dúvida hiperbólica, cogito, critérios de verdade e o racionalismo moderno.",
        habilidades: "EM13CHS101, EM13CHS501",
        intro:
          "Descartes duvidou de tudo o que podia ser posto em dúvida para encontrar um fundamento seguro do conhecimento.",
        definicao:
          "A **dúvida metódica** é o procedimento de suspender o juízo sobre tudo o que admite dúvida, até encontrar uma verdade indubitável.",
        itens: [
          "Os sentidos podem enganar.",
          "O sonho e a vigília podem se confundir.",
          "Um gênio maligno poderia simular o mundo.",
          "Penso, logo existo resiste a toda dúvida.",
        ],
        chamada: {
          estilo: "simbolos",
          texto: "Cogito, ergo sum: penso, logo existo.",
        },
        exemplo: "Por que nem mesmo o gênio maligno pode duvidar do cogito?",
        resolucao:
          "Para duvidar é preciso pensar, e pensar exige um sujeito que pensa. \\resultado{A dúvida confirma o pensamento e a existência.}",
        dica: "A dúvida cartesiana é um método provisório, e não uma posição cética final.",
        quiz: [
          {
            e: "O cogito afirma:",
            alt: [
              "Penso, logo existo",
              "Duvido, logo não existo",
              "Sinto, logo penso",
              "Existo, logo duvido",
            ],
            correta: 0,
          },
          {
            e: "A dúvida metódica serve para:",
            alt: [
              "Negar todo conhecimento",
              "Encontrar um fundamento seguro",
              "Abandonar a razão",
              "Provar os sentidos",
            ],
            correta: 1,
          },
        ],
        aberta:
          "Explique por que Descartes desconfia dos sentidos mesmo reconhecendo a utilidade deles.",
        gabarito:
          "Ilusões e sonhos mostram que os sentidos às vezes enganam, então não servem de base última.",
      },
      {
        titulo: "Contratualistas: Hobbes e Locke",
        mes: 2,
        serie: "3º ano",
        sobre: "Estado de natureza, contrato social, soberania e limites do poder.",
        habilidades: "EM13CHS101, EM13CHS501",
        intro:
          "Hobbes e Locke explicam a origem do Estado a partir de um contrato entre os indivíduos.",
        definicao:
          "O **contrato social** é a ideia de que a sociedade política nasce de um acordo entre pessoas que deixam o estado de natureza para viver sob regras comuns.",
        itens: [
          "Para Hobbes, o estado de natureza é uma guerra de todos.",
          "O soberano de Hobbes concentra o poder para garantir a paz.",
          "Para Locke, os direitos naturais antecedem o Estado.",
          "O poder legítimo se limita a proteger a vida, a liberdade e a propriedade.",
        ],
        chamada: {
          estilo: "atencao",
          texto:
            "As duas teorias justificam poderes muito diferentes: um absoluto e outro limitado.",
        },
        exemplo: "Qual a diferença central entre o soberano de Hobbes e o governo de Locke?",
        resolucao:
          "Hobbes concentra o poder para evitar o caos; Locke o limita pela confiança dos governados. \\resultado{Absolutismo versus governo limitado e revogável.}",
        dica: "Os autores partem do mesmo conceito de estado de natureza, mas descrevem-no de formas opostas.",
        quiz: [
          {
            e: "Para Hobbes, o estado de natureza é:",
            alt: [
              "Pacífico e cooperativo",
              "Guerra de todos contra todos",
              "Um paraíso",
              "Uma república",
            ],
            correta: 1,
          },
          {
            e: "Locke defende que o governo:",
            alt: [
              "É absoluto",
              "Protege direitos naturais",
              "Substitui a moral",
              "Não pode ser questionado",
            ],
            correta: 1,
          },
        ],
        aberta:
          "Explique como a ideia de contrato social sustenta o direito de resistir a um governo injusto.",
        gabarito:
          "Se o poder nasce de um acordo, ele se rompe quando deixa de cumprir a finalidade pactuada.",
      },
      {
        titulo: "Kant e o dever moral",
        mes: 3,
        serie: "3º ano",
        sobre: "Imperativo categórico, autonomia, dignidade e a crítica da moral heterônoma.",
        habilidades: "EM13CHS101, EM13CHS502",
        intro:
          "Kant procura um critério moral que valha para todos, independente de desejos e consequências.",
        definicao:
          "O **imperativo categórico** ordena agir apenas segundo a máxima que se possa querer como lei universal.",
        itens: [
          "A moral kantiana é formal e universal.",
          "Tratar pessoas como fins, nunca apenas como meios.",
          "A autonomia é a capacidade de dar a si a própria lei.",
          "A dignidade humana não tem preço.",
        ],
        chamada: {
          estilo: "simbolos",
          texto: "Age de tal modo que a tua máxima possa se tornar uma lei universal.",
        },
        exemplo: "Por que mentir para obter vantagem contraria o imperativo categórico?",
        resolucao:
          "A máxima da mentira não pode ser universalizada sem destruir a confiança na fala. \\resultado{A promessa falsa se autodestrói como regra.}",
        dica: "Kant avalia a intenção e o dever, e não apenas o resultado da ação.",
        quiz: [
          {
            e: "O imperativo categórico é:",
            alt: [
              "Uma regra condicional",
              "Uma lei moral universal",
              "Um conselho de prudência",
              "Uma emoção",
            ],
            correta: 1,
          },
          {
            e: "Para Kant, as pessoas devem ser tratadas:",
            alt: [
              "Como meios para fins",
              "Como fins em si",
              "Como objetos",
              "Conforme a conveniência",
            ],
            correta: 1,
          },
        ],
        aberta: "Explique por que, para Kant, a dignidade não admite preço nem troca.",
        gabarito:
          "Pessoas são fins em si; o que tem preço pode ser substituído, o que tem dignidade não.",
      },
      {
        titulo: "Utilitarismo",
        mes: 4,
        serie: "3º ano",
        sobre: "Consequencialismo, maior felicidade, cálculo das consequências e críticas.",
        habilidades: "EM13CHS101, EM13CHS502",
        intro:
          "O utilitarismo avalia as ações pelas consequências e busca maximizar o bem-estar coletivo.",
        definicao:
          "O **utilitarismo** sustenta que a ação correta é a que produz a maior soma de bem-estar para o maior número de pessoas afetadas.",
        itens: [
          "Bentham propôs um cálculo de prazeres e dores.",
          "Mill distingue qualidades de prazer.",
          "O critério é consequencialista.",
          "Críticas apontam riscos de sacrificar minorias.",
        ],
        chamada: {
          estilo: "diaadia",
          texto:
            "Decisões de saúde pública costumam comparar benefícios e custos para a coletividade.",
        },
        exemplo: "Como um utilitarista decidiria onde alocar um recurso escasso de saúde?",
        resolucao:
          "Comparando quantas pessoas se beneficiam e quanto bem-estar cada opção gera. \\resultado{A opção com maior benefício agregado.}",
        dica: "O utilitarismo olha as consequências, mas isso não significa desprezar regras: elas podem ser úteis a longo prazo.",
        quiz: [
          {
            e: "O utilitarismo avalia as ações por:",
            alt: ["Intenções", "Consequências", "Tradições", "Emoções"],
            correta: 1,
          },
          {
            e: "Uma crítica frequente ao utilitarismo é:",
            alt: [
              "Ignorar a felicidade",
              "Poder sacrificar minorias",
              "Não considerar resultados",
              "Ser impossível de calcular",
            ],
            correta: 1,
          },
        ],
        aberta:
          "Explique uma vantagem e um risco de decidir políticas públicas pelo critério utilitarista.",
        gabarito:
          "Vantagem: foco no bem-estar coletivo. Risco: desconsiderar direitos de grupos pequenos.",
      },
      {
        titulo: "Existencialismo",
        mes: 5,
        serie: "3º ano",
        sobre: "Existência, liberdade, responsabilidade e a angústia das escolhas.",
        habilidades: "EM13CHS101, EM13CHS502",
        intro:
          "Para os existencialistas, a existência precede a essência: cada pessoa se define pelas escolhas que faz.",
        definicao:
          "O **existencialismo** sustenta que o ser humano não nasce com uma essência pronta; ele constrói a si mesmo por meio de escolhas livres e responsáveis.",
        itens: [
          "A existência precede a essência.",
          "A liberdade é inseparável da responsabilidade.",
          "A angústia nasce da consciência de escolher.",
          "A má-fé é fugir da própria liberdade.",
        ],
        chamada: {
          estilo: "simbolos",
          texto: "Estamos condenados a ser livres.",
        },
        exemplo: "O que Sartre chama de má-fé?",
        resolucao:
          "É fingir que não se pode escolher, atribuindo a decisão ao destino ou às circunstâncias. \\resultado{Negar a própria liberdade para fugir da responsabilidade.}",
        dica: "Liberdade existencialista não é fazer o que se quer: é assumir o peso das escolhas.",
        quiz: [
          {
            e: "No existencialismo, a existência:",
            alt: [
              "Precede a essência",
              "Segue a essência",
              "Não importa",
              "É determinada pela genética",
            ],
            correta: 0,
          },
          {
            e: "A má-fé consiste em:",
            alt: [
              "Assumir a liberdade",
              "Negar a própria liberdade",
              "Ajudar o próximo",
              "Estudar filosofia",
            ],
            correta: 1,
          },
        ],
        aberta: "Explique por que a liberdade, para Sartre, vem acompanhada de angústia.",
        gabarito:
          "Cada escolha exclui alternativas e compromete quem escolhe, sem garantia de acerto.",
      },
      {
        titulo: "Escola de Frankfurt e indústria cultural",
        mes: 6,
        serie: "3º ano",
        sobre: "Teoria crítica, racionalidade instrumental, indústria cultural e massificação.",
        habilidades: "EM13CHS101, EM13CHS502",
        intro:
          "Os frankfurtianos analisaram como a razão técnica e a cultura de massa moldam a vida social.",
        definicao:
          "A **indústria cultural** é a produção padronizada de bens culturais para consumo de massa, que transforma cultura em mercadoria.",
        itens: [
          "A razão instrumental reduz fins a cálculos de eficiência.",
          "A cultura de massa padroniza gostos.",
          "O entretenimento pode neutralizar a crítica.",
          "A autonomia do indivíduo fica ameaçada.",
        ],
        chamada: {
          estilo: "atencao",
          texto:
            "Algoritmos de recomendação podem reforçar padrões de consumo e reduzir a diversidade de repertório.",
        },
        exemplo: "Como a indústria cultural transforma uma obra de arte em mercadoria?",
        resolucao:
          "Ela padroniza o formato, calcula o apelo e organiza a distribuição para o consumo rápido. \\resultado{Formato padronizado e circulação comercial.}",
        dica: "Teoria crítica não é recusa da razão: é crítica ao uso instrumental da razão.",
        quiz: [
          {
            e: "A indústria cultural produz bens culturais:",
            alt: [
              "De forma artesanal e única",
              "De forma padronizada para o consumo de massa",
              "Sem fins comerciais",
              "Apenas para museus",
            ],
            correta: 1,
          },
          {
            e: "A razão instrumental se caracteriza por:",
            alt: [
              "Buscar fins éticos",
              "Priorizar eficiência e cálculo",
              "Negar a técnica",
              "Valorizar a tradição",
            ],
            correta: 1,
          },
        ],
        aberta: "Explique como o entretenimento de massa pode enfraquecer o pensamento crítico.",
        gabarito: "O consumo contínuo e padronizado reduz o tempo e o hábito de análise reflexiva.",
      },
      {
        titulo: "Justiça em Rawls",
        mes: 8,
        serie: "3º ano",
        sobre: "Posição original, véu da ignorância, princípios de justiça e equidade.",
        habilidades: "EM13CHS101, EM13CHS501",
        intro:
          "Rawls propõe pensar a justiça como equidade a partir de um experimento mental que impede privilegiar interesses próprios.",
        definicao:
          "O **véu da ignorância** é o dispositivo que obriga os participantes a escolher princípios de justiça sem saber que posição ocuparão na sociedade.",
        itens: [
          "A posição original garante imparcialidade.",
          "O primeiro princípio protege liberdades básicas.",
          "O segundo admite desigualdades que beneficiam os menos favorecidos.",
          "A justiça como equidade busca fair play social.",
        ],
        chamada: {
          estilo: "simbolos",
          texto:
            "Desigualdades só se justificam se melhorarem a situação dos que estão em pior posição.",
        },
        exemplo: "Que princípios seriam escolhidos sob o véu da ignorância?",
        resolucao:
          "Liberdades iguais e desigualdades que beneficiem todos, especialmente os menos favorecidos. \\resultado{Dois princípios de justiça.}",
        dica: "O véu da ignorância não elimina a racionalidade: apenas impede saber a própria posição.",
        quiz: [
          {
            e: "O véu da ignorância serve para garantir:",
            alt: ["Vantagem pessoal", "Imparcialidade", "Riqueza", "Tradição"],
            correta: 1,
          },
          {
            e: "Para Rawls, desigualdades são aceitáveis quando:",
            alt: [
              "Aumentam a eficiência",
              "Beneficiam os menos favorecidos",
              "Favorecem a maioria",
              "São naturais",
            ],
            correta: 1,
          },
        ],
        aberta: "Aplique o véu da ignorância para avaliar uma política de cotas em universidades.",
        gabarito:
          "Sem saber a própria posição, seria racional aceitar medidas que ampliem o acesso dos grupos excluídos.",
      },
      {
        titulo: "Ética e tecnologia",
        mes: 9,
        serie: "3º ano",
        sobre: "Privacidade, algoritmos, inteligência artificial e responsabilidade moral.",
        habilidades: "EM13CHS101, EM13CHS502",
        intro:
          "A tecnologia amplia capacidades e cria dilemas sobre privacidade, autonomia e responsabilidade.",
        definicao:
          "A **ética aplicada** examina problemas morais concretos, como vigilância, viés algorítmico e uso de dados pessoais.",
        itens: [
          "Dados pessoais têm valor econômico e político.",
          "Algoritmos podem reproduzir vieses históricos.",
          "Automação exige decisão humana responsável.",
          "Consentimento informado é critério central.",
        ],
        chamada: {
          estilo: "atencao",
          texto:
            "A responsabilidade por decisões automatizadas não desaparece porque o sistema é técnico.",
        },
        exemplo: "Por que um sistema de reconhecimento facial pode ser eticamente problemático?",
        resolucao:
          "Ele pode errar mais em certos grupos e ampliar vigilância sem consentimento. \\resultado{Viés e vigilância exigem limites e auditoria.}",
        dica: "Pergunte sempre quem decide, com quais dados e quem responde pelos erros.",
        quiz: [
          {
            e: "Um risco ético de algoritmos é:",
            alt: [
              "Reproduzir vieses",
              "Aumentar a velocidade",
              "Reduzir custos",
              "Armazenar dados",
            ],
            correta: 0,
          },
          {
            e: "O consentimento informado exige:",
            alt: [
              "Assinatura automática",
              "Informação clara sobre o uso dos dados",
              "Sigilo total",
              "Anonimato opcional",
            ],
            correta: 1,
          },
        ],
        aberta:
          "Proponha um princípio ético para o uso de dados de estudantes em plataformas educacionais.",
        gabarito:
          "Uso limitado à finalidade pedagógica, com transparência e controle pelos responsáveis.",
      },
    ],
  },
  {
    chave: "sociologia",
    professor: "sofia",
    nome: "Sociologia",
    cor: "rosa",
    icone: "BookOpen",
    ordem: 4,
    aulas: [
      {
        titulo: "Sociologia como ciência",
        mes: 2,
        serie: "1º ano",
        sobre: "Surgimento da sociologia, autores clássicos e imaginação sociológica.",
        habilidades: "EM13CHS101, EM13CHS502",
        intro:
          "A sociologia nasce com a industrialização para explicar as transformações sociais da modernidade.",
        definicao:
          "A **sociologia** é a ciência que estuda a vida social, as instituições e as relações entre indivíduos e sociedade.",
        itens: [
          "Comte propôs a física social.",
          "Durkheim consolidou o método sociológico.",
          "Weber enfatizou a ação social.",
          "Marx analisou classes e conflitos.",
        ],
        chamada: {
          estilo: "simbolos",
          texto: "A imaginação sociológica liga a biografia individual aos processos históricos.",
        },
        exemplo: "Como a imaginação sociológica explica o desemprego de um indivíduo?",
        resolucao:
          "Ela relaciona a trajetória pessoal a processos econômicos e políticos mais amplos. \\resultado{Biografia e história se conectam.}",
        dica: "A sociologia não julga o senso comum: ela o problematiza e investiga com método.",
        quiz: [
          {
            e: "A sociologia se consolidou como ciência no:",
            alt: ["Século XVI", "Século XIX", "Século XX", "Século XV"],
            correta: 1,
          },
          {
            e: "Um autor clássico da sociologia é:",
            alt: ["Durkheim", "Descartes", "Kant", "Platão"],
            correta: 0,
          },
        ],
        aberta:
          "Explique como a imaginação sociológica ajuda a compreender problemas aparentemente individuais.",
        gabarito:
          "Ela mostra que decisões e dificuldades pessoais são condicionadas por estruturas sociais.",
      },
      {
        titulo: "Cultura e etnocentrismo",
        mes: 3,
        serie: "1º ano",
        sobre: "Cultura, relativismo, etnocentrismo, diversidade e identidade.",
        habilidades: "EM13CHS102, EM13CHS502",
        intro:
          "Cultura é tudo o que se aprende e se compartilha em sociedade, e julgá-la a partir de padrões próprios produz etnocentrismo.",
        definicao:
          "O **etnocentrismo** é a tendência de avaliar outras culturas pelos padrões da própria, tomando-a como referência superior.",
        itens: [
          "Cultura inclui língua, valores, hábitos e técnicas.",
          "Relativizar não é aceitar tudo: é compreender no contexto.",
          "A diversidade cultural é constitutiva das sociedades.",
          "Identidades se formam em relações sociais.",
        ],
        chamada: {
          estilo: "diaadia",
          texto:
            "Piadas que ridicularizam sotaques ou costumes são exemplos cotidianos de etnocentrismo.",
        },
        exemplo: "Por que o relativismo cultural é importante para a pesquisa social?",
        resolucao:
          "Ele evita que o pesquisador projete seus próprios valores sobre o grupo estudado. \\resultado{Compreensão sem julgamento prévio.}",
        dica: "Relativismo cultural não significa neutralidade moral diante de violações de direitos.",
        quiz: [
          {
            e: "O etnocentrismo é:",
            alt: [
              "Valorizar todas as culturas igualmente",
              "Julgar outras culturas pela própria",
              "Estudar folclore",
              "Negar a cultura",
            ],
            correta: 1,
          },
          {
            e: "A cultura é:",
            alt: [
              "Biológica e fixa",
              "Aprendida e compartilhada",
              "Individual e isolada",
              "Apenas artística",
            ],
            correta: 1,
          },
        ],
        aberta:
          "Explique a diferença entre reconhecer a diversidade cultural e aceitar práticas que violam direitos.",
        gabarito: "Compreender o contexto não impede defender direitos humanos universais.",
      },
      {
        titulo: "Socialização e instituições",
        mes: 4,
        serie: "1º ano",
        sobre: "Processos de socialização, família, escola, mídia e instituições sociais.",
        habilidades: "EM13CHS102, EM13CHS502",
        intro:
          "A socialização transmite normas e valores por meio de instituições como família, escola e mídia.",
        definicao:
          "**Socialização** é o processo pelo qual os indivíduos aprendem e interiorizam normas, valores e papéis sociais.",
        itens: [
          "Socialização primária ocorre na família.",
          "Socialização secundária amplia repertórios.",
          "A escola ensina regras formais e convivência.",
          "As instituições reproduzem e transformam a sociedade.",
        ],
        chamada: {
          estilo: "simbolos",
          texto:
            "Papéis sociais são expectativas associadas a posições, como estudante, filho ou trabalhador.",
        },
        exemplo: "Como a escola socializa para além do conteúdo curricular?",
        resolucao:
          "Ela ensina horários, hierarquias, cooperação e regras de convivência. \\resultado{Normas e valores do ambiente escolar.}",
        dica: "A socialização não é imposição total: as pessoas reinterpretam e resistem às normas.",
        quiz: [
          {
            e: "A socialização primária acontece principalmente:",
            alt: ["Na família", "No trabalho", "Na universidade", "No sindicato"],
            correta: 0,
          },
          {
            e: "Uma instituição social é:",
            alt: [
              "Um prédio público",
              "Um padrão organizado de relações e normas",
              "Uma pessoa famosa",
              "Um documento",
            ],
            correta: 1,
          },
        ],
        aberta: "Explique como as redes sociais participam hoje da socialização de jovens.",
        gabarito: "Elas transmitem modelos, normas e identidades em escala ampliada e imediata.",
      },
      {
        titulo: "Trabalho e divisão social",
        mes: 3,
        serie: "2º ano",
        sobre: "Divisão do trabalho, alienação, precarização e transformações do emprego.",
        habilidades: "EM13CHS102, EM13CHS403",
        intro:
          "A divisão do trabalho aumenta a produtividade e cria dependências, hierarquias e desigualdades.",
        definicao:
          "A **divisão social do trabalho** é a repartição de tarefas e funções entre grupos e indivíduos, com efeitos sobre produtividade e poder.",
        itens: [
          "Durkheim estuda a solidariedade orgânica.",
          "Marx analisa a alienação do trabalhador.",
          "Weber relaciona trabalho e burocracia.",
          "A plataformização cria novas formas de precarização.",
        ],
        chamada: {
          estilo: "diaadia",
          texto:
            "Entregadores de aplicativo dependem de algoritmos que definem rotas, preços e avaliações.",
        },
        exemplo: "O que significa alienação do trabalho em Marx?",
        resolucao:
          "O trabalhador perde o controle sobre o processo e o produto do próprio trabalho. \\resultado{Estrangeamento diante da atividade e do resultado.}",
        dica: "Divisão do trabalho não é sinônimo de desigualdade: ela se torna desigual conforme as relações de poder.",
        quiz: [
          {
            e: "A divisão do trabalho pode gerar:",
            alt: [
              "Maior produtividade e novas dependências",
              "Fim das hierarquias",
              "Igualdade automática",
              "Redução da tecnologia",
            ],
            correta: 0,
          },
          {
            e: "A alienação do trabalho foi analisada por:",
            alt: ["Marx", "Kant", "Platão", "Descartes"],
            correta: 0,
          },
        ],
        aberta:
          "Explique um efeito positivo e um efeito negativo da divisão do trabalho nas sociedades modernas.",
        gabarito:
          "Positivo: eficiência e especialização. Negativo: fragmentação e perda de sentido do trabalho.",
      },
      {
        titulo: "Classes sociais em Marx e Weber",
        mes: 4,
        serie: "2º ano",
        sobre: "Classes, estratificação, status, poder e mobilidade social.",
        habilidades: "EM13CHS102, EM13CHS403",
        intro:
          "Marx e Weber explicam a desigualdade social com critérios diferentes, ligados à produção e à distribuição de poder.",
        definicao:
          "Para Marx, as **classes** se definem pela posição nas relações de produção; para Weber, a estratificação combina classe, status e poder.",
        itens: [
          "Marx destaca a relação entre capital e trabalho.",
          "Weber distingue classe, estamento e partido.",
          "Mobilidade social mede mudanças de posição.",
          "Desigualdades se reproduzem entre gerações.",
        ],
        chamada: {
          estilo: "simbolos",
          texto: "A classe social não é apenas renda: envolve relações, oportunidades e poder.",
        },
        exemplo: "Como Weber diferenciaria um empresário rico de um médico respeitado?",
        resolucao:
          "O primeiro tem classe e poder econômico; o segundo tem status e prestígio social. \\resultado{Classe e status não coincidem sempre.}",
        dica: "Compare os critérios dos autores antes de aplicar um conceito ao caso concreto.",
        quiz: [
          {
            e: "Para Marx, a classe social se define pela:",
            alt: ["Posição nas relações de produção", "Renda anual", "Escolaridade", "Religião"],
            correta: 0,
          },
          {
            e: "Weber acrescenta às classes as noções de:",
            alt: ["Status e poder", "Natureza e cultura", "Raça e etnia apenas", "Idade e sexo"],
            correta: 0,
          },
        ],
        aberta:
          "Explique por que a mobilidade social é mais difícil para famílias com menos recursos.",
        gabarito:
          "Educação, redes e patrimônio acumulado condicionam as oportunidades de ascensão.",
      },
      {
        titulo: "Cidadania e direitos",
        mes: 5,
        serie: "2º ano",
        sobre: "Direitos civis, políticos e sociais, gerações de direitos e efetivação.",
        habilidades: "EM13CHS102, EM13CHS502",
        intro:
          "A cidadania se constrói historicamente pela conquista de direitos civis, políticos e sociais.",
        definicao:
          "**Cidadania** é o conjunto de direitos e deveres que definem a participação do indivíduo na comunidade política.",
        itens: [
          "Direitos civis: liberdade e propriedade.",
          "Direitos políticos: votar e ser votado.",
          "Direitos sociais: saúde, educação e trabalho.",
          "Direitos difusos: meio ambiente e consumidor.",
        ],
        chamada: {
          estilo: "atencao",
          texto: "Direito garantido no papel não basta: é preciso efetivação no cotidiano.",
        },
        exemplo: "Por que o voto é um direito político e a saúde um direito social?",
        resolucao:
          "O voto define a participação no poder; a saúde garante condições materiais de vida. \\resultado{Dimensões distintas e complementares da cidadania.}",
        dica: "A cidadania é conquista histórica, não concessão natural do Estado.",
        quiz: [
          {
            e: "O direito de votar é um direito:",
            alt: ["Civil", "Político", "Social", "Difuso"],
            correta: 1,
          },
          {
            e: "Saúde e educação são direitos:",
            alt: ["Civis", "Políticos", "Sociais", "Comerciais"],
            correta: 2,
          },
        ],
        aberta: "Explique por que a efetivação dos direitos sociais depende de políticas públicas.",
        gabarito:
          "Sem serviços, orçamento e fiscalização, os direitos permanecem apenas declarados.",
      },
      {
        titulo: "Movimentos sociais",
        mes: 6,
        serie: "2º ano",
        sobre: "Ação coletiva, repertórios de protesto, conquistas e institucionalização.",
        habilidades: "EM13CHS102, EM13CHS502",
        intro:
          "Movimentos sociais organizam demandas coletivas e pressionam o Estado e a sociedade por mudanças.",
        definicao:
          "**Movimento social** é uma ação coletiva organizada em torno de uma demanda comum, com repertórios próprios de mobilização.",
        itens: [
          "Repertórios incluem marchas, greves e campanhas.",
          "Identidade coletiva sustenta a mobilização.",
          "Conquistas podem ser incorporadas em leis.",
          "A institucionalização traz riscos e ganhos.",
        ],
        chamada: {
          estilo: "diaadia",
          texto: "Muitos direitos trabalhistas e sociais nasceram de mobilizações coletivas.",
        },
        exemplo: "Como um movimento social transforma uma demanda em política pública?",
        resolucao:
          "Ele amplia o debate, pressiona autoridades e negocia propostas com o Estado. \\resultado{Da mobilização à agenda pública e à lei.}",
        dica: "Movimentos sociais não são sinônimos de partidos nem de grupos de interesse.",
        quiz: [
          {
            e: "Um repertório típico de movimento social é:",
            alt: ["A greve", "O decreto", "A sentença", "O imposto"],
            correta: 0,
          },
          {
            e: "A identidade coletiva em um movimento serve para:",
            alt: [
              "Dividir o grupo",
              "Sustentar a mobilização",
              "Evitar demandas",
              "Fortalecer o governo",
            ],
            correta: 1,
          },
        ],
        aberta:
          "Explique uma conquista histórica de movimentos sociais brasileiros e como ela foi obtida.",
        gabarito: "Exemplo: aposentadoria rural, ligada à mobilização de trabalhadores do campo.",
      },
      {
        titulo: "Desigualdade no Brasil",
        mes: 3,
        serie: "3º ano",
        sobre: "Concentração de renda, indicadores sociais, raça, gênero e território.",
        habilidades: "EM13CHS102, EM13CHS403",
        intro:
          "O Brasil combina crescimento econômico com uma das maiores concentrações de renda do mundo.",
        definicao:
          "A **desigualdade social** é a distribuição desigual de recursos, oportunidades e poder entre grupos e territórios.",
        itens: [
          "Índice de Gini mede a concentração de renda.",
          "Desigualdades de raça e gênero se somam.",
          "O território reproduz a segregação.",
          "Políticas redistributivas reduzem a pobreza.",
        ],
        chamada: {
          estilo: "simbolos",
          texto: "Quanto mais próximo de 1, maior a concentração de renda no índice de Gini.",
        },
        exemplo: "Por que renda média alta pode conviver com pobreza extrema?",
        resolucao:
          "A média esconde a concentração: poucos ganham muito e muitos ganham pouco. \\resultado{A média não revela a distribuição.}",
        figura: "Distribuição de renda por faixa populacional em dados de exemplo.",
        dica: "Compare média, mediana e indicadores de distribuição para ler a desigualdade.",
        quiz: [
          {
            e: "O índice de Gini mede:",
            alt: ["A concentração de renda", "O desemprego", "A inflação", "A escolaridade"],
            correta: 0,
          },
          {
            e: "A desigualdade brasileira se caracteriza por:",
            alt: [
              "Distribuição equilibrada",
              "Forte concentração de renda",
              "Ausência de pobreza",
              "Igualdade territorial",
            ],
            correta: 1,
          },
        ],
        aberta: "Explique como a desigualdade territorial afeta o acesso a serviços públicos.",
        gabarito:
          "Periferias e áreas rurais costumam ter menos equipamentos, transporte e infraestrutura.",
      },
      {
        titulo: "Juventudes e cultura digital",
        mes: 4,
        serie: "3º ano",
        sobre: "Identidades juvenis, redes sociais, consumo, sociabilidade e desigualdade digital.",
        habilidades: "EM13CHS102, EM13CHS502",
        intro:
          "As juventudes constroem identidades também no ambiente digital, com novas formas de sociabilidade e conflito.",
        definicao:
          "**Cultura digital** é o conjunto de práticas, valores e formas de interação que emergem do uso cotidiano das tecnologias conectadas.",
        itens: [
          "Redes ampliam voz e exposição.",
          "Identidades se exibem e se negociam on-line.",
          "Desigualdade de acesso limita oportunidades.",
          "Desinformação circula com rapidez.",
        ],
        chamada: {
          estilo: "atencao",
          texto:
            "O anonimato relativo das redes facilita discursos agressivos e efeitos em cascata.",
        },
        exemplo: "Como as redes sociais influenciam a construção da identidade juvenil?",
        resolucao:
          "Elas oferecem modelos, grupos de pertencimento e validação pública. \\resultado{Identidade se forma também por reconhecimento digital.}",
        dica: "Fale de juventudes no plural: as experiências variam por classe, raça, gênero e território.",
        quiz: [
          {
            e: "A desigualdade digital se refere a:",
            alt: [
              "Diferenças de acesso e qualidade de conexão",
              "Número de aparelhos por casa",
              "Velocidade de digitação",
              "Preço dos celulares",
            ],
            correta: 0,
          },
          {
            e: "Uma consequência da cultura digital é:",
            alt: [
              "Fim da sociabilidade",
              "Novas formas de interação e conflito",
              "Ausência de identidades",
              "Fim da desigualdade",
            ],
            correta: 1,
          },
        ],
        aberta: "Proponha duas ações da escola para formar uso crítico das redes sociais.",
        gabarito:
          "Debater checagem de informações e produzir conteúdo próprio com responsabilidade.",
      },
      {
        titulo: "Sociedade de risco e meio ambiente",
        mes: 5,
        serie: "3º ano",
        sobre: "Riscos ambientais, justiça climática, consumo e responsabilidade coletiva.",
        habilidades: "EM13CHS102, EM13CHS304",
        intro:
          "A produção industrial de riscos globais, como mudanças climáticas, exige respostas coletivas e globais.",
        definicao:
          "A **sociedade de risco** descreve sociedades que produzem riscos ambientais e tecnológicos de alcance global, distribuídos de forma desigual.",
        itens: [
          "Riscos climáticos atingem mais os vulneráveis.",
          "Desastres combinam natureza e decisões humanas.",
          "Consumo e produção geram impactos difusos.",
          "Justiça ambiental cobra reparação e prevenção.",
        ],
        chamada: {
          estilo: "simbolos",
          texto: "Justiça climática liga a crise ambiental às desigualdades sociais existentes.",
        },
        exemplo: "Por que enchentes atingem de forma desigual bairros ricos e periferias?",
        resolucao:
          "Drenagem, moradia e infraestrutura variam conforme a renda e o território. \\resultado{O risco ambiental é socialmente distribuído.}",
        dica: "Riscos não são apenas naturais: decisões de ocupação e investimento os agravam.",
        quiz: [
          {
            e: "A sociedade de risco destaca:",
            alt: [
              "Riscos globais produzidos socialmente",
              "Ausência de riscos",
              "Riscos apenas naturais",
              "Fim dos desastres",
            ],
            correta: 0,
          },
          {
            e: "A justiça climática defende:",
            alt: [
              "Distribuição justa de impactos e responsabilidades",
              "Fim da ciência",
              "Isolamento dos países",
              "Uso ilimitado de recursos",
            ],
            correta: 0,
          },
        ],
        aberta: "Explique como decisões de planejamento urbano podem reduzir riscos ambientais.",
        gabarito:
          "Drenagem, áreas verdes, fiscalização e moradia segura reduzem exposição e danos.",
      },
      {
        titulo: "Democracia e participação",
        mes: 8,
        serie: "3º ano",
        sobre:
          "Democracia representativa e participativa, instituições, cidadania ativa e desinformação.",
        habilidades: "EM13CHS102, EM13CHS501",
        intro:
          "A democracia combina instituições representativas e formas diretas de participação, sempre sob risco de erosão.",
        definicao:
          "**Democracia** é o regime em que o poder deriva do povo, com eleições livres, respeito a direitos e controles entre poderes.",
        itens: [
          "Eleições periódicas e livres são condição mínima.",
          "Controles institucionais limitam o poder.",
          "Conselhos e audiências ampliam a participação.",
          "Desinformação e polarização ameaçam a qualidade democrática.",
        ],
        chamada: {
          estilo: "atencao",
          texto: "Democracia não é apenas votar: exige direitos, informação e responsabilidade.",
        },
        exemplo: "Como um conselho de escola exemplifica participação democrática?",
        resolucao:
          "Ele reúne diferentes setores para debater e decidir prioridades comuns. \\resultado{Decisão coletiva e controle social.}",
        dica: "Distinga a forma de governo da qualidade da vida democrática cotidiana.",
        quiz: [
          {
            e: "Uma condição mínima da democracia é:",
            alt: [
              "Eleições livres e periódicas",
              "Ausência de leis",
              "Poder único",
              "Censura da imprensa",
            ],
            correta: 0,
          },
          {
            e: "A desinformação ameaça a democracia porque:",
            alt: [
              "Facilita decisões informadas",
              "Prejudica o debate público",
              "Aumenta a transparência",
              "Reduz a polarização",
            ],
            correta: 1,
          },
        ],
        aberta: "Proponha duas formas de ampliar a participação democrática na comunidade escolar.",
        gabarito: "Grêmio ativo e conselhos com voz deliberativa sobre projetos e orçamento.",
      },
    ],
  },
  // FIM_DA_MASSA
];
