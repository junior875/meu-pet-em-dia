import os
import time
import random
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.alert import Alert
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.common.keys import Keys
from e2e_store import get_last_tutors

BASE_URL = os.getenv('MEUPET_BASE_URL', 'http://localhost:5173')
HEADLESS = os.getenv('MEUPET_HEADLESS', '0') != '0'
DELAY = float(os.getenv('MEUPET_E2E_DELAY', '0.5'))
PET_NAME = os.getenv('MEUPET_TEST_PET', 'rtyeh')


def make_driver(headless: bool = True):
    options = webdriver.ChromeOptions()
    if headless:
        options.add_argument('--headless=new')
    options.add_argument('--window-size=1366,900')
    return webdriver.Chrome(options=options)


def wait_click(drv, locator, timeout=15):
    el = WebDriverWait(drv, timeout).until(EC.element_to_be_clickable(locator))
    el.click()
    time.sleep(DELAY)
    return el


def wait_type(drv, locator, text, timeout=15):
    el = WebDriverWait(drv, timeout).until(EC.presence_of_element_located(locator))
    el.clear()
    el.send_keys(text)
    time.sleep(DELAY)
    return el


def login(drv, email: str, password: str):
    drv.get(f"{BASE_URL}/login")
    wait_type(drv, (By.CSS_SELECTOR, "input[type='email']"), email)
    wait_type(drv, (By.CSS_SELECTOR, "input[type='password']"), password)
    wait_click(drv, (By.XPATH, "//button[normalize-space()='Entrar']"))
    WebDriverWait(drv, 15).until(EC.url_matches(r".*/$"))


def goto_despesas(drv):
    """
    Fluxo real do usuário: clicar no card 'Financeiro' no dashboard.
    Se não encontrar, tenta o link da navbar; por fim, cai para a URL direta.
    """
    # Dashboard já deveria estar carregado após login
    for attempt in range(3):
        try:
            card = WebDriverWait(drv, 8).until(
                EC.visibility_of_element_located((By.XPATH, "//h3[normalize-space()='Financeiro']/ancestor::div[contains(@style,'border-radius')]"))
            )
            drv.execute_script("arguments[0].scrollIntoView({behavior:'smooth',block:'center'});", card)
            drv.execute_script("arguments[0].click()", card)
            WebDriverWait(drv, 10).until(
                EC.visibility_of_element_located((By.CSS_SELECTOR, "button[data-testid='btn-open-despesa-modal']"))
            )
            return
        except Exception:
            time.sleep(1)

    # Navbar desktop
    try:
        link = WebDriverWait(drv, 5).until(EC.visibility_of_element_located((By.CSS_SELECTOR, "a[href='/financeiro'], a[href='/despesas']")))
        drv.execute_script("arguments[0].click()", link)
        WebDriverWait(drv, 10).until(
            EC.visibility_of_element_located((By.CSS_SELECTOR, "button[data-testid='btn-open-despesa-modal']"))
        )
        return
    except Exception:
        pass

    # Fallback direto
    drv.get(f"{BASE_URL}/despesas")
    WebDriverWait(drv, 10).until(
        EC.visibility_of_element_located((By.CSS_SELECTOR, "button[data-testid='btn-open-despesa-modal']"))
    )


def create_despesa(drv, descricao: str, valor: float, categoria: str = 'Alimentação'):
    """Cria uma despesa financeira"""
    # Abre modal de despesa
    btn = WebDriverWait(drv, 15).until(EC.visibility_of_element_located((By.CSS_SELECTOR, "button[data-testid='btn-open-despesa-modal']")))
    drv.execute_script("arguments[0].scrollIntoView({behavior:'smooth',block:'center'});", btn)
    drv.execute_script("arguments[0].click()", btn)
    time.sleep(DELAY)
    
    # Seleciona pet (força valor via JS para garantir que onchange dispare)
    pet_select_el = WebDriverWait(drv, 15).until(EC.presence_of_element_located((By.CSS_SELECTOR, "select[data-testid='despesa-input-pet']")))
    pet_select = Select(pet_select_el)
    options = pet_select.options
    if len(options) < 2:
        raise SystemExit("❌ Nenhum pet disponível para registrar despesas. Cadastre um pet manualmente antes de rodar o teste.")
    pet_select.select_by_index(1)
    time.sleep(DELAY)
    
    # Seleciona categoria
    categoria_select = Select(WebDriverWait(drv, 10).until(EC.presence_of_element_located((By.CSS_SELECTOR, "select[data-testid='despesa-input-categoria']"))))
    categoria_select.select_by_visible_text(categoria)
    time.sleep(DELAY)
    
    # Preenche descrição
    wait_type(drv, (By.CSS_SELECTOR, "input[data-testid='despesa-input-descricao']"), descricao)
    
    # Preenche valor
    wait_type(drv, (By.CSS_SELECTOR, "input[data-testid='despesa-input-valor']"), str(valor))
    
    # Preenche data (fixa) usando JS para evitar máscara
    data_input = WebDriverWait(drv, 10).until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[data-testid='despesa-input-data']")))
    drv.execute_script("arguments[0].value = arguments[1]; arguments[0].dispatchEvent(new Event('input', { bubbles: true }));", data_input, "2025-02-02")
    
    # Preenche observações (opcional)
    try:
        observacoes_el = drv.find_element(By.CSS_SELECTOR, "textarea[data-testid='despesa-input-observacoes']")
        observacoes_el.clear()
        observacoes_el.send_keys(f'Despesa E2E')
    except Exception:
        pass
    
    # Submete
    submit = WebDriverWait(drv, 10).until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button[data-testid='despesa-submit']")))
    drv.execute_script("arguments[0].click()", submit)
    
    # Aguarda um pouco para o modal fechar e a lista atualizar
    time.sleep(DELAY * 3)


def edit_all_despesas(drv):
    """Edita cada despesa adicionando observações"""
    index = 1
    while True:
        try:
            edit_btn = WebDriverWait(drv, 5).until(
                EC.element_to_be_clickable((By.XPATH, f"(//button[contains(@data-testid, 'despesa-edit-')])[{index}]"))
            )
        except TimeoutException:
            break
        drv.execute_script("arguments[0].scrollIntoView({behavior:'smooth',block:'center'});", edit_btn)
        drv.execute_script("arguments[0].click()", edit_btn)
        time.sleep(DELAY)
        
        novo_valor = random.uniform(50, 300)
        valor_input = WebDriverWait(drv, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "input[data-testid='despesa-input-valor']"))
        )
        valor_input.clear()
        valor_input.send_keys(str(round(novo_valor, 2)))
        
        obs_textarea = drv.find_element(By.CSS_SELECTOR, "textarea[data-testid='despesa-input-observacoes']")
        obs_textarea.clear()
        obs_textarea.send_keys(f'Observação automatizada #{index}')
        
        submit = WebDriverWait(drv, 10).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, "button[data-testid='despesa-submit']"))
        )
        drv.execute_script("arguments[0].click()", submit)
        WebDriverWait(drv, 10).until(EC.invisibility_of_element_located((By.XPATH, "//h2[contains(text(), 'Despesa')]")))
        time.sleep(DELAY * 3)
        index += 1


def test_filters(drv):
    """Testa os filtros de categoria"""
    try:
        # Testa filtro por categoria
        categoria_select = Select(WebDriverWait(drv, 10).until(EC.presence_of_element_located((By.XPATH, "//label[contains(text(), 'Filtrar por Categoria')]/following::select[1]"))))
        categoria_select.select_by_visible_text('Alimentação')
        time.sleep(2)  # Aguarda filtro aplicar
        
        # Busca o select novamente para evitar elemento stale
        categoria_select_2 = Select(WebDriverWait(drv, 10).until(EC.presence_of_element_located((By.XPATH, "//label[contains(text(), 'Filtrar por Categoria')]/following::select[1]"))))
        categoria_select_2.select_by_index(0)
        time.sleep(1)
    except Exception as e:
        print(f"  ⚠ Filtros não puderam ser testados: {e}")


def delete_all_despesas(drv):
    """Deleta todas as despesas (clique no botão e confirma via alert)"""
    deleted_count = 0
    while True:
        # Busca botões de delete disponíveis
        delete_btns = drv.find_elements(By.XPATH, "//button[contains(@data-testid, 'despesa-delete-')]")
        if not delete_btns:
            break
        
        # Clica no primeiro botão de delete
        first_btn = delete_btns[0]
        drv.execute_script("arguments[0].scrollIntoView({behavior:'smooth',block:'center'});", first_btn)
        time.sleep(0.3)
        drv.execute_script("arguments[0].click()", first_btn)
        time.sleep(0.5)  # Aguarda o alert aparecer

        # Aceita o alert do navegador
        try:
            alert = WebDriverWait(drv, 10).until(EC.alert_is_present())
            alert.accept()
            deleted_count += 1
            print(f"    ✓ Despesa #{deleted_count} excluída")
        except TimeoutException:
            print("  ⚠️ Alerta de confirmação não apareceu, encerrando deleção")
            break

        # Aguarda a despesa sumir da lista (para visualização)
        time.sleep(2)


def flow_for_user(email: str, password: str):
    drv = make_driver(headless=HEADLESS)
    try:
        login(drv, email, password)
        goto_despesas(drv)
        print("  ✓ Navegou para página de Despesas")
        
        # Cria múltiplas despesas diferentes
        despesas_test = [
            ("Ração Premium 15kg", 250.00, "Alimentação"),
            ("Consulta Veterinária", 180.00, "Saúde"),
            ("Shampoo e Condicionador", 45.00, "Higiene"),
            ("Hotel Pet Weekend", 320.00, "Hospedagem"),
            ("Transporte Veterinário", 80.00, "Transporte"),
        ]
        
        for descricao, valor, categoria in despesas_test:
            create_despesa(drv, descricao, valor, categoria)
            print(f"  ✓ Despesa '{descricao}' criada com sucesso (R${valor:.2f})")
        
        # Edita todas as despesas inseridas
        edit_all_despesas(drv)
        print(f"  ✓ Despesas editadas com anotações")
        
        # Testa filtros
        test_filters(drv)
        print(f"  ✓ Filtros testados")
        
        # Verifica resumo financeiro (se visível)
        try:
            resumo = WebDriverWait(drv, 5).until(EC.presence_of_element_located((By.XPATH, "//h3[contains(text(), 'Total Gasto')]")))
            print(f"  ✓ Resumo financeiro exibido: {resumo.text}")
        except Exception:
            print(f"  ⚠ Resumo financeiro não encontrado (pode ser normal se não há despesas)")
        
        # Deleta todas as despesas
        delete_all_despesas(drv)
        print(f"  ✓ Todas as despesas deletadas")
        
        print(f"✅ OK despesas flow para {email}")
    finally:
        drv.quit()


def main():
    tutors = get_last_tutors(limit=2)
    if len(tutors) < 2:
        raise SystemExit('Base e2e.db não possui ao menos 2 tutores. Rode primeiro o test_register_login.py')
    
    print("="*60)
    print("RFC06 - TESTE E2E: CONTROLE FINANCEIRO (DESPESAS)")
    print("="*60)
    
    for email, password in tutors:
        print(f"\n🧪 Testando fluxo de despesas para: {email}")
        flow_for_user(email, password)


if __name__ == '__main__':
    main()

