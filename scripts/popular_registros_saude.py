"""
Script para popular registros de saúde no banco de dados
Usado para testar a funcionalidade de Relatórios de Saúde (RFC07)
"""

import sqlite3
from datetime import datetime, timedelta
import random
import os

# Caminho do banco de dados
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'backend', 'data', 'app.db')

# Dados para popular
TIPOS_REGISTRO = ['Vacina', 'Consulta', 'Cirurgia', 'Exame']

VACINAS = [
    'Vacina V10 (Polivalente)',
    'Vacina Antirrábica',
    'Vacina Giárdia',
    'Vacina Gripe Canina',
    'Vacina Leishmaniose',
]

CONSULTAS = [
    'Check-up de rotina',
    'Consulta dermatológica',
    'Consulta cardiológica',
    'Consulta oftalmológica',
    'Consulta emergencial',
]

EXAMES = [
    'Hemograma completo',
    'Exame de fezes',
    'Ultrassom abdominal',
    'Raio-X de tórax',
    'Exame de urina',
]

CIRURGIAS = [
    'Castração',
    'Extração dentária',
    'Remoção de tumor',
    'Cirurgia ortopédica',
]

VETERINARIOS = [
    'Dr. Carlos Mendes',
    'Dra. Ana Paula Silva',
    'Dr. Roberto Oliveira',
    'Dra. Juliana Santos',
    'Dr. Fernando Costa',
    'Dra. Beatriz Almeida',
]

def conectar_banco():
    """Conecta ao banco de dados SQLite"""
    if not os.path.exists(DB_PATH):
        print(f"❌ Banco de dados não encontrado em: {DB_PATH}")
        print("💡 Certifique-se de que o backend já foi executado pelo menos uma vez.")
        return None
    
    return sqlite3.connect(DB_PATH)

def buscar_pet_por_nome(conn, nome_pet):
    """Busca um pet pelo nome"""
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, species, ownerId FROM pets WHERE name LIKE ?", (f'%{nome_pet}%',))
    pet = cursor.fetchone()
    
    if pet:
        return {
            'id': pet[0],
            'name': pet[1],
            'species': pet[2],
            'ownerId': pet[3]
        }
    return None

def gerar_data_aleatoria(dias_atras_min=1, dias_atras_max=365):
    """Gera uma data aleatória no passado"""
    dias_atras = random.randint(dias_atras_min, dias_atras_max)
    data = datetime.now() - timedelta(days=dias_atras)
    return data.strftime('%Y-%m-%d')

def gerar_horario_aleatorio():
    """Gera um horário aleatório entre 08:00 e 18:00"""
    hora = random.randint(8, 17)
    minuto = random.choice([0, 15, 30, 45])
    return f"{hora:02d}:{minuto:02d}"

def criar_registro_saude(conn, pet_id, user_id, tipo, data, horario, profissional, observacao=None):
    """Cria um registro de saúde no banco"""
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO registros_saude (petId, userId, tipoRegistro, data, horario, profissional, filePath)
        VALUES (?, ?, ?, ?, ?, ?, NULL)
    """, (pet_id, user_id, tipo, data, horario, profissional, ))
    
    conn.commit()
    return cursor.lastrowid

def popular_registros(conn, pet, quantidade=15):
    """Popula o banco com registros de saúde variados"""
    print(f"\n📋 Criando {quantidade} registros de saúde para o pet '{pet['name']}'...")
    print("="*60)
    
    registros_criados = []
    
    for i in range(quantidade):
        tipo = random.choice(TIPOS_REGISTRO)
        data = gerar_data_aleatoria(dias_atras_min=30, dias_atras_max=730)  # Entre 1 mês e 2 anos atrás
        horario = gerar_horario_aleatorio()
        profissional = random.choice(VETERINARIOS)
        
        # Gera observação baseada no tipo
        if tipo == 'Vacina':
            descricao = random.choice(VACINAS)
            observacao = f"{descricao}. Pet reagiu bem ao procedimento."
        elif tipo == 'Consulta':
            descricao = random.choice(CONSULTAS)
            observacao = f"{descricao}. Pet apresentou bom estado geral de saúde."
        elif tipo == 'Exame':
            descricao = random.choice(EXAMES)
            observacao = f"{descricao}. Resultados dentro da normalidade."
        else:  # Cirurgia
            descricao = random.choice(CIRURGIAS)
            observacao = f"{descricao}. Procedimento realizado com sucesso. Recuperação satisfatória."
        
        try:
            registro_id = criar_registro_saude(
                conn, 
                pet['id'], 
                pet['ownerId'],  # userId é o dono do pet
                tipo, 
                data, 
                horario, 
                profissional, 
                observacao
            )
            
            registros_criados.append({
                'id': registro_id,
                'tipo': tipo,
                'descricao': descricao,
                'data': data,
                'horario': horario,
                'profissional': profissional
            })
            
            print(f"✅ [{i+1}/{quantidade}] {tipo} - {descricao}")
            print(f"   📅 {data} às {horario} | 👨‍⚕️ {profissional}")
            
        except Exception as e:
            print(f"❌ Erro ao criar registro: {e}")
    
    return registros_criados

def mostrar_resumo(registros):
    """Mostra resumo dos registros criados"""
    print("\n" + "="*60)
    print("📊 RESUMO DOS REGISTROS CRIADOS")
    print("="*60)
    
    # Conta por tipo
    resumo_tipos = {}
    for reg in registros:
        tipo = reg['tipo']
        resumo_tipos[tipo] = resumo_tipos.get(tipo, 0) + 1
    
    print(f"\n✨ Total de registros criados: {len(registros)}")
    print("\n📋 Por tipo:")
    emojis = {
        'Vacina': '💉',
        'Consulta': '🩺',
        'Exame': '🔬',
        'Cirurgia': '⚕️'
    }
    for tipo, quantidade in sorted(resumo_tipos.items()):
        emoji = emojis.get(tipo, '📋')
        print(f"   {emoji} {tipo}: {quantidade}")
    
    # Período coberto
    datas = [reg['data'] for reg in registros]
    data_mais_antiga = min(datas)
    data_mais_recente = max(datas)
    print(f"\n📅 Período: {data_mais_antiga} até {data_mais_recente}")
    
    # Profissionais
    profissionais = set(reg['profissional'] for reg in registros)
    print(f"\n👨‍⚕️ Profissionais: {len(profissionais)} veterinários diferentes")

def main():
    print("="*60)
    print("🏥 POPULAR REGISTROS DE SAÚDE - RFC07")
    print("="*60)
    
    # Conectar ao banco
    conn = conectar_banco()
    if not conn:
        return
    
    print(f"✅ Conectado ao banco: {DB_PATH}")
    
    # Buscar pet
    nome_pet = 'rtyeh'
    print(f"\n🔍 Buscando pet com nome '{nome_pet}'...")
    pet = buscar_pet_por_nome(conn, nome_pet)
    
    if not pet:
        print(f"❌ Pet '{nome_pet}' não encontrado no banco!")
        print("💡 Certifique-se de que o pet existe e o nome está correto.")
        conn.close()
        return
    
    print(f"✅ Pet encontrado: {pet['name']} (ID: {pet['id']}, Espécie: {pet['species']})")
    
    # Verificar registros existentes
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM registros_saude WHERE petId = ?", (pet['id'],))
    registros_existentes = cursor.fetchone()[0]
    
    if registros_existentes > 0:
        print(f"\n⚠️  O pet já tem {registros_existentes} registro(s) de saúde.")
        resposta = input("Deseja adicionar mais registros? (s/n): ").strip().lower()
        if resposta != 's':
            print("❌ Operação cancelada.")
            conn.close()
            return
    
    # Popular registros
    quantidade = 15
    print(f"\n🎲 Será criado {quantidade} registros aleatórios de saúde...")
    input("Pressione ENTER para continuar...")
    
    registros = popular_registros(conn, pet, quantidade)
    
    # Mostrar resumo
    mostrar_resumo(registros)
    
    # Fechar conexão
    conn.close()
    
    print("\n" + "="*60)
    print("✅ CONCLUÍDO COM SUCESSO!")
    print("="*60)
    print(f"\n💡 Agora você pode testar o relatório de saúde em:")
    print(f"   http://localhost:5173/relatorios")
    print(f"\n📋 Selecione o pet '{pet['name']}' e clique em 'Gerar Relatório'")

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n❌ Operação cancelada pelo usuário.")
    except Exception as e:
        print(f"\n❌ Erro: {e}")

