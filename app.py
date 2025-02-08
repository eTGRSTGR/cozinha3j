from flask import Flask, render_template, jsonify, request, g, Response, redirect, url_for, session
from functools import wraps
from dotenv import load_dotenv
import os
from database import init_db, get_db
import json
from datetime import datetime

# Carregar variáveis do .env
load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY')

# Inicializar o banco de dados na criação da aplicação
with app.app_context():
    init_db()

def init_app():
    init_db()
    
@app.before_request
def before_request():
    g.db = get_db()

@app.teardown_request
def teardown_request(exception):
    if hasattr(g, 'db'):
        g.db.close()

# Variável global para armazenar o último ID de pedido
ultimo_pedido_id = 0

# Função decoradora para proteger rotas
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'logged_in' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        if username == os.getenv('ADMIN_USERNAME') and password == os.getenv('ADMIN_PASSWORD'):
            session['logged_in'] = True
            return redirect(url_for('admin_panel'))
        else:
            return render_template('login.html', error='Credenciais inválidas')
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('logged_in', None)
    return redirect(url_for('login'))

@app.route('/admin/stream')
def stream_pedidos():
    def event_stream():
        global ultimo_pedido_id
        while True:
            # Verificar novos pedidos
            db = get_db()
            try:
                cur = db.cursor()
                cur.execute('''
                    SELECT p.*, COUNT(i.id) as total_items
                    FROM pedidos p
                    LEFT JOIN itens_pedido i ON p.id = i.pedido_id
                    WHERE p.id > ?
                    GROUP BY p.id
                    ORDER BY p.data_pedido DESC, p.id DESC
                    LIMIT 1
                ''', (ultimo_pedido_id,))
                
                novo_pedido = cur.fetchone()
                
                if novo_pedido:
                    ultimo_pedido_id = novo_pedido['id']
                    # Converter o pedido para dict
                    pedido_dict = dict(novo_pedido)
                    yield f"data: {json.dumps(pedido_dict)}\n\n"
            
            finally:
                db.close()
            
            # Aguardar 3 segundos antes da próxima verificação
            from time import sleep
            sleep(3)

    return Response(event_stream(), mimetype="text/event-stream")

@app.route('/api/cart/add', methods=['POST'])
def add_to_cart():
    data = request.json
    # Implementar lógica do carrinho
    return jsonify({"success": True})

@app.route('/api/cart/checkout', methods=['POST'])
def checkout():
    data = request.json
    if not data:
        return jsonify({
            "success": False,
            "message": "Dados não fornecidos"
        }), 400

    if not all(key in data for key in ['name', 'address', 'items', 'total']):
        return jsonify({
            "success": False,
            "message": "Dados incompletos"
        }), 400

    db = get_db()
    try:
        cur = db.cursor()
        
        # Criar novo pedido com apenas a data
        cur.execute('''
            INSERT INTO pedidos (data_pedido, status, valor_total, cliente_nome, cliente_endereco)
            VALUES (?, ?, ?, ?, ?)
        ''', (datetime.now().strftime('%Y-%m-%d'),  # Modificado para mostrar apenas a data
              'pendente', 
              float(data['total']), 
              str(data['name']), 
              str(data['address'])))
        
        pedido_id = cur.lastrowid
        
        # Inserir itens do pedido
        for item in data['items']:
            cur.execute('''
                INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario)
                VALUES (?, ?, ?, ?)
            ''', (pedido_id, 
                  int(item['id']), 
                  int(item['quantity']), 
                  float(item['price'])))
        
        db.commit()
        
        return jsonify({
            "success": True,
            "order_id": pedido_id,
            "message": "Pedido realizado com sucesso!"
        })
    except Exception as e:
        print(f"Erro no checkout: {str(e)}")  # Log do erro
        db.rollback()
        return jsonify({
            "success": False,
            "message": "Erro ao processar o pedido: " + str(e)
        }), 500
    finally:
        db.close()

# Remover a função decoradora de login_required
@app.route('/admin')
def admin_panel():
    db = get_db()
    try:
        cur = db.cursor()
        # Modificada a query para evitar duplicação
        cur.execute('''
            SELECT p.id, p.data_pedido, p.status, p.valor_total, p.cliente_nome, p.cliente_endereco,
                   (SELECT COUNT(*) FROM itens_pedido WHERE pedido_id = p.id) as total_items
            FROM pedidos p
            ORDER BY p.data_pedido DESC, p.id DESC
        ''')
        pedidos = cur.fetchall()
        return render_template('admin.html', pedidos=pedidos)
    finally:
        db.close()

# Remover a função decoradora de login_required
@app.route('/api/admin/pedido/<int:pedido_id>', methods=['GET'])
def get_pedido_detalhes(pedido_id):
    db = get_db()
    try:
        cur = db.cursor()
        # Buscar detalhes do pedido
        cur.execute('SELECT * FROM pedidos WHERE id = ?', (pedido_id,))
        pedido = cur.fetchone()
        
        # Buscar itens do pedido
        cur.execute('''
            SELECT * FROM itens_pedido 
            WHERE pedido_id = ?
        ''', (pedido_id,))
        itens = cur.fetchall()
        
        return jsonify({
            "pedido": dict(pedido),
            "itens": [dict(item) for item in itens]
        })
    finally:
        db.close()

# Remover a função decoradora de login_required
@app.route('/api/admin/pedido/<int:pedido_id>/status', methods=['PUT'])
def atualizar_status_pedido(pedido_id):
    data = request.json
    if not data or 'status' not in data:
        return jsonify({"success": False, "message": "Status não fornecido"}), 400
    
    db = get_db()
    try:
        cur = db.cursor()
        cur.execute('''
            UPDATE pedidos 
            SET status = ? 
            WHERE id = ?
        ''', (data['status'], pedido_id))
        db.commit()
        return jsonify({
            "success": True,
            "message": f"Status do pedido {pedido_id} atualizado para {data['status']}"
        })
    except Exception as e:
        db.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        db.close()

# Remover a função decoradora de login_required
@app.route('/api/admin/pedido/<int:pedido_id>', methods=['DELETE'])
def deletar_pedido(pedido_id):
    db = get_db()
    try:
        cur = db.cursor()
        # Primeiro deletar os itens do pedido (devido à chave estrangeira)
        cur.execute('DELETE FROM itens_pedido WHERE pedido_id = ?', (pedido_id,))
        # Depois deletar o pedido
        cur.execute('DELETE FROM pedidos WHERE id = ?', (pedido_id,))
        db.commit()
        return jsonify({
            "success": True,
            "message": f"Pedido {pedido_id} excluído com sucesso"
        })
    except Exception as e:
        db.rollback()
        return jsonify({
            "success": False,
            "message": f"Erro ao excluir pedido: {str(e)}"
        }), 500
    finally:
        db.close()

def load_menu():
    with open('menu.json', 'r', encoding='utf-8') as file:
        return json.load(file)

@app.route('/')
def index():
    menu_items = load_menu()
    return render_template('index.html', menu_categories=menu_items)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', use_reloader=False)
