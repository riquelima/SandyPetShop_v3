# Regra de Uso das Skills

O usuário solicitou que as skills (instaladas na pasta `.agents/skills/`) sejam utilizadas **sempre que for feita uma pergunta**. 

Para cumprir esse requisito, a cada nova requisição do usuário:
1. Analise o contexto da requisição para identificar qual(is) skill(s) em `.agents/skills/` é(são) a(s) mais adequada(s) (ex: `react-expert`, `frontend-developer`, etc).
2. Utilize a ferramenta `view_file` para carregar e ler as diretrizes do arquivo `SKILL.md` dessa respectiva skill.
3. Adote a persona e siga as práticas estipuladas pela skill na sua execução e resposta.
