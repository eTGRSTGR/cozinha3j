# Cardápio Digital

Este é um projeto de Cardápio Digital desenvolvido com Flask e JavaScript. Ele permite que os clientes visualizem o cardápio, adicionem itens ao carrinho e finalizem o pedido. O administrador pode gerenciar os pedidos através de um painel administrativo.

## Funcionalidades

- Visualização do cardápio
- Adição de itens ao carrinho
- Finalização de pedidos
- Painel administrativo para gerenciar pedidos
- Impressão de pedidos em impressora térmica de 58mm

## Tecnologias Utilizadas

- Flask
- JavaScript
- HTML/CSS
- SQLite (para banco de dados)

## Como Executar o Projeto

1. Clone o repositório:
    ```bash
    git clone https://github.com/seu-usuario/cardapio-digital.git
    cd cardapio-digital
    ```

2. Crie um ambiente virtual e ative-o:
    ```bash
    python -m venv venv
    source venv/bin/activate  # No Windows, use `venv\Scripts\activate`
    ```

3. Instale as dependências:
    ```bash
    pip install -r requirements.txt
    ```

4. Configure as variáveis de ambiente:
    Crie um arquivo `.env` na raiz do projeto e adicione as seguintes variáveis:
    ```
    SECRET_KEY=sua_chave_secreta
    ADMIN_USERNAME=admin
    ADMIN_PASSWORD=senha
    ```

5. Inicialize o banco de dados:
    ```bash
    flask init-db
    ```

6. Execute a aplicação:
    ```bash
    flask run
    ```

7. Acesse a aplicação em `http://127.0.0.1:5000`.

## Estrutura do Projeto

```
/workspaces/codespaces-blank/
├── aplicativo/
│   ├── static/
│   │   ├── css/
│   │   ├── js/
│   │   └── notification.mp3
│   ├── templates/
│   │   ├── index.html
│   │   └── admin.html
│   ├── app.py
│   ├── database.py
│   └── ...
├── .env
├── requirements.txt
└── README.md
```

## Licença

Este projeto está licenciado sob a Licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
