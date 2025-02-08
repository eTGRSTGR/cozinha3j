import sqlite3
from datetime import datetime
import os

DATABASE_PATH = 'database.sqlite'

def init_db():
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        c = conn.cursor()
        
        # Remover tabelas se existirem para recriar
        c.executescript('''
            DROP TABLE IF EXISTS itens_pedido;
            DROP TABLE IF EXISTS pedidos;
            
            CREATE TABLE pedidos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                data_pedido TIMESTAMP NOT NULL,
                status TEXT NOT NULL,
                valor_total REAL NOT NULL,
                cliente_nome TEXT NOT NULL,
                cliente_endereco TEXT NOT NULL
            );

            CREATE TABLE itens_pedido (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pedido_id INTEGER,
                produto_id INTEGER,
                quantidade INTEGER NOT NULL,
                preco_unitario REAL NOT NULL,
                FOREIGN KEY (pedido_id) REFERENCES pedidos (id)
            );
        ''')
        
        conn.commit()
        print("Banco de dados inicializado com sucesso!")
    except Exception as e:
        print(f"Erro ao inicializar o banco de dados: {str(e)}")
    finally:
        conn.close()

def get_db():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# Inicializar o banco de dados ao importar o módulo
init_db()
