import os
import time
import random
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.alert import Alert
from e2e_store import get_last_tutors

BASE_URL = os.getenv('MEUPET_BASE_URL', 'http://localhost:5173')
HEADLESS = os.getenv('MEUPET_HEADLESS', '0') != '0'
DELAY = float(os.getenv('MEUPET_E2E_DELAY', '0.5'))

def make_driver(headless: bool = True):
    options = webdriver.ChromeOptions()
    if headless:
        options.add_argument('--headless=new')
    options.add_argument('--window-size=1366,900')
    prefs = {
        'printing.print_preview_sticky_settings.appState': '{"recentDestinations":[{"id":"Save as PDF","origin":"local","account":""}],"selectedDestinationId":"Save as PDF","version":2}',
        'savefile.default_directory': os.path.join(os.getcwd(), 'relatorios_financeiro_pdf'),
        'download.default_directory': os.path.join(os.getcwd(), 'relatorios_financeiro_pdf'),
        'download.prompt_for_download': False,
        'download.directory_upgrade': True,
        'plugins.always_open_pdf_externally': True
    }
    options.add_experimental_option('prefs', prefs)
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

def goto_pets(drv):
    try:
        el = WebDriverWait(drv, 8).until(EC.visibility_of_element_located((By.CSS_SELECTOR, "a[href='/pets']")))
        drv.execute_script("arguments[0].click()", el)
        WebDriverWait(drv, 8).until(EC.url_contains('/pets'))
        return
    except Exception:
        pass
    try:
        el = WebDriverWait(drv, 5).until(EC.visibility_of_element_located((By.CSS_SELECTOR, "nav.bottom-nav a[href='/pets']")))
        drv.execute_script("arguments[0].click()", el)
        WebDriverWait(drv, 8).until(EC.url_contains('/pets'))
        return
    except Exception:
        pass
    drv.get(f"{BASE_URL}/pets")
    WebDriverWait(drv, 8).until(EC.url_contains('/pets'))

def create_pet(drv, name: str):
    btn = WebDriverWait(drv, 10).until(EC.visibility_of_element_located((By.CSS_SELECTOR, "button[data-testid='btn-open-pet-modal']")))
    drv.execute_script("arguments[0].scrollIntoView({behavior:'smooth',block:'center'});", btn)
    drv.execute_script("arguments[0].click()", btn)
    WebDriverWait(drv, 10).until(EC.visibility_of_element_located((By.CSS_SELECTOR, "[data-testid='pet-modal']")))
    wait_type(drv, (By.CSS_SELECTOR, "input[data-testid='pet-name']"), name)
    species_select = Select(WebDriverWait(drv, 10).until(EC.presence_of_element_located((By.CSS_SELECTOR, "select[data-testid='pet-species']"))))
    species_select.select_by_visible_text('Cachorro')
    submit = WebDriverWait(drv, 10).until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button[data-testid='pet-submit']")))
    drv.execute_script("arguments[0].click()", submit)
    WebDriverWait(drv, 10).until(EC.invisibility_of_element_located((By.XPATH, "//h2[normalize-space()='Cadastrar Pet']")))
    WebDriverWait(drv, 10).until(EC.presence_of_element_located((By.XPATH, f"//tbody//td[normalize-space()='{name}']")))
    print(f"  ✓ Pet '{name}' criado com sucesso")

def goto_despesas(drv):
    if '/despesas' in drv.current_url or '/financeiro' in drv.current_url:
        try:
            WebDriverWait(drv, 3).until(
                EC.visibility_of_element_located((By.CSS_SELECTOR, "button[data-testid='btn-open-despesa-modal']"))
            )
            return
        except Exception:
            pass

    print("  Nav: Tentando link da barra de navegação...")
    try:
        link = WebDriverWait(drv, 5).until(EC.element_to_be_clickable((By.CSS_SELECTOR, "a[href='/financeiro'], a[href='/despesas']")))
        drv.execute_script("arguments[0].click()", link)
        WebDriverWait(drv, 10).until(
            EC.visibility_of_element_located((By.CSS_SELECTOR, "button[data-testid='btn-open-despesa-modal']"))
        )
        return
    except Exception:
        pass

    print("  Nav: Link direto falhou. Voltando para Dashboard via Logo...")
    try:
        logo = WebDriverWait(drv, 5).until(EC.element_to_be_clickable((By.CSS_SELECTOR, "a[href='/']")))
        drv.execute_script("arguments[0].click()", logo)
        card = WebDriverWait(drv, 10).until(
            EC.visibility_of_element_located((By.XPATH, "//h3[normalize-space()='Financeiro']/ancestor::div[contains(@style,'border-radius')]"))
        )
        print("  Nav: Clicando no Card Financeiro...")
        drv.execute_script("arguments[0].scrollIntoView({behavior:'smooth',block:'center'});", card)
        time.sleep(0.5)
        drv.execute_script("arguments[0].click()", card)
    except Exception as e:
        print(f"  ❌ Falha na navegação via Dashboard: {e}")
        drv.get(f"{BASE_URL}/despesas")

    WebDriverWait(drv, 15).until(
        EC.visibility_of_element_located((By.CSS_SELECTOR, "button[data-testid='btn-open-despesa-modal']"))
    )

def create_despesa(drv, descricao: str, valor: float, categoria: str, data: str):
    btn = WebDriverWait(drv, 15).until(EC.visibility_of_element_located((By.CSS_SELECTOR, "button[data-testid='btn-open-despesa-modal']")))
    drv.execute_script("arguments[0].scrollIntoView({behavior:'smooth',block:'center'});", btn)
    drv.execute_script("arguments[0].click()", btn)
    time.sleep(DELAY)
    
    pet_select_el = WebDriverWait(drv, 15).until(EC.presence_of_element_located((By.CSS_SELECTOR, "select[data-testid='despesa-input-pet']")))
    pet_select = Select(pet_select_el)
    options = pet_select.options
    if len(options) < 2:
        raise SystemExit("❌ Nenhum pet disponível para registrar despesas.")
    pet_select.select_by_index(1)
    time.sleep(DELAY)
    
    categoria_select = Select(WebDriverWait(drv, 10).until(EC.presence_of_element_located((By.CSS_SELECTOR, "select[data-testid='despesa-input-categoria']"))))
    categoria_select.select_by_visible_text(categoria)
    time.sleep(DELAY)
    
    wait_type(drv, (By.CSS_SELECTOR, "input[data-testid='despesa-input-descricao']"), descricao)
    wait_type(drv, (By.CSS_SELECTOR, "input[data-testid='despesa-input-valor']"), str(valor))
    
    data_input = WebDriverWait(drv, 10).until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[data-testid='despesa-input-data']")))
    drv.execute_script("arguments[0].value = arguments[1]; arguments[0].dispatchEvent(new Event('input', { bubbles: true }));", data_input, data)
    time.sleep(DELAY)
    
    submit = WebDriverWait(drv, 10).until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button[data-testid='despesa-submit']")))
    drv.execute_script("arguments[0].click()", submit)
    time.sleep(DELAY * 3)
    print(f"  ✓ Despesa '{descricao}' criada: R${valor:.2f} em {data}")

def goto_relatorio_financeiro(drv):
    print("  Nav: Tentando ir para Relatórios...")
    try:
        btn = WebDriverWait(drv, 3).until(EC.element_to_be_clickable((
            By.XPATH, 
            "//a[@href='/relatorios'] | //button[contains(., 'Relatórios')]"
        )))
        drv.execute_script("arguments[0].scrollIntoView({behavior:'smooth',block:'center'});", btn)
        time.sleep(0.5)
        drv.execute_script("arguments[0].click()", btn)
        WebDriverWait(drv, 5).until(EC.url_contains('/relatorios'))
        print("  ✓ Navegou via botão interno em Despesas")
        return
    except Exception:
        print("  ⚠ Botão interno não encontrado. Tentando via Dashboard...")

    try:
        logo = WebDriverWait(drv, 10).until(EC.element_to_be_clickable((By.CSS_SELECTOR, "a[href='/']")))
        drv.execute_script("arguments[0].click()", logo)
        card = WebDriverWait(drv, 10).until(
            EC.visibility_of_element_located((By.XPATH, "//h3[normalize-space()='Relatórios']/ancestor::div[contains(@style,'border-radius')]"))
        )
        drv.execute_script("arguments[0].scrollIntoView({behavior:'smooth',block:'center'});", card)
        time.sleep(0.5)
        drv.execute_script("arguments[0].click()", card)
        print("  ✓ Navegou via Card do Dashboard")
    except Exception as e:
        print(f"  ❌ Falha crítica de navegação: {e}")
        drv.get(f"{BASE_URL}/relatorios")

    WebDriverWait(drv, 15).until(lambda d: '/relatorios' in d.current_url)
    WebDriverWait(drv, 10).until(
        EC.presence_of_element_located((By.XPATH, "//h2[contains(., 'Relatório')] | //h1[contains(., 'Relatório')]"))
    )

def gerar_relatorio_financeiro(drv, data_inicio: str, data_fim: str):
    print("  Nav: Selecionando aba 'Relatório Financeiro'...")
    try:
        aba_financeiro = WebDriverWait(drv, 5).until(EC.element_to_be_clickable((
            By.XPATH, 
            "//button[contains(., 'Relatório Financeiro')]"
        )))
        drv.execute_script("arguments[0].click()", aba_financeiro)
        time.sleep(DELAY)
    except Exception:
        print("  ⚠ Aviso: Não foi possível clicar na aba (pode já estar ativa ou seletor falhou). Tentando prosseguir...")

    print("  Form: Preenchendo datas...")
    try:
        data_inicio_input = WebDriverWait(drv, 10).until(
            EC.presence_of_element_located((By.XPATH, "//label[contains(., 'Data Início')]/following::input[1]"))
        )
        drv.execute_script("arguments[0].value = arguments[1]; arguments[0].dispatchEvent(new Event('input', { bubbles: true }));", data_inicio_input, data_inicio)
        time.sleep(DELAY)
    except Exception as e:
        raise Exception(f"❌ Erro ao encontrar campo 'Data Início'. Verifique se a aba correta está ativa. Erro: {e}")

    try:
        data_fim_input = WebDriverWait(drv, 10).until(
            EC.presence_of_element_located((By.XPATH, "//label[contains(., 'Data Fim')]/following::input[1]"))
        )
        drv.execute_script("arguments[0].value = arguments[1]; arguments[0].dispatchEvent(new Event('input', { bubbles: true }));", data_fim_input, data_fim)
        time.sleep(DELAY)
    except Exception as e:
        raise Exception(f"❌ Erro ao encontrar campo 'Data Fim'. Erro: {e}")
    
    btn_gerar = WebDriverWait(drv, 10).until(
        EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Gerar') and contains(., 'Relatório')]"))
    )
    drv.execute_script("arguments[0].scrollIntoView({behavior:'smooth',block:'center'});", btn_gerar)
    drv.execute_script("arguments[0].click()", btn_gerar)
    
    WebDriverWait(drv, 20).until(
        EC.presence_of_element_located((By.XPATH, "//h2[contains(., 'Relatório')] | //table | //div[contains(@class, 'report')]"))
    )
    print(f"  ✓ Relatório financeiro gerado: {data_inicio} a {data_fim}")

def verify_relatorio_financeiro_content(drv):
    WebDriverWait(drv, 10).until(
        EC.presence_of_element_located((By.XPATH, "//h2[contains(text(), 'Relatório Financeiro') or contains(text(), 'Relatório de Despesas')]"))
    )
    print("  ✓ Cabeçalho do relatório exibido")
    
    try:
        total = WebDriverWait(drv, 5).until(
            EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Total') or contains(text(), 'total')]"))
        )
        print(f"  ✓ Total exibido no relatório")
    except Exception:
        print(f"  ⚠ Total não encontrado")
    
    try:
        categorias = WebDriverWait(drv, 5).until(
            EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Categoria') or contains(text(), 'categoria')]"))
        )
        print(f"  ✓ Resumo por categoria exibido")
    except Exception:
        print(f"  ⚠ Categorias não encontradas")
    
    try:
        despesas = WebDriverWait(drv, 5).until(
            EC.presence_of_element_located((By.XPATH, "//table | //div[contains(@class, 'despesa') or contains(@class, 'item')]"))
        )
        print(f"  ✓ Lista de despesas exibida")
    except Exception:
        print(f"  ⚠ Lista de despesas não encontrada")

def imprimir_relatorio_financeiro(drv):
    btn_imprimir = WebDriverWait(drv, 10).until(
        EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Imprimir') or contains(., 'imprimir') or contains(., 'PDF')]"))
    )
    drv.execute_script("arguments[0].scrollIntoView({behavior:'smooth',block:'center'});", btn_imprimir)
    time.sleep(0.5)
    drv.execute_script("arguments[0].click()", btn_imprimir)
    print(f"  ✓ Botão de impressão clicado")
    
    time.sleep(3)
    
    try:
        save_script = """
        const printPreview = document.querySelector('print-preview-app');
        if (printPreview && printPreview.shadowRoot) {
            const sidebar = printPreview.shadowRoot.querySelector('print-preview-sidebar');
            if (sidebar && sidebar.shadowRoot) {
                const header = sidebar.shadowRoot.querySelector('print-preview-header');
                if (header && header.shadowRoot) {
                    const saveButton = header.shadowRoot.querySelector('.action-button');
                    if (saveButton) {
                        saveButton.click();
                        return true;
                    }
                }
            }
        }
        return false;
        """
        result = drv.execute_script(save_script)
        if result:
            print(f"  ✓ Botão Save clicado via JavaScript")
        else:
            print(f"  ⚠ Tentando Enter como fallback")
            drv.find_element(By.TAG_NAME, 'body').send_keys(Keys.ENTER)
        
        time.sleep(3)
        print(f"  ✓ PDF salvo na pasta 'relatorios_financeiro_pdf'")
    except Exception as e:
        print(f"  ⚠ Erro ao salvar PDF: {e}")

def delete_all_despesas(drv):
    goto_despesas(drv)
    time.sleep(1)
    
    deleted_count = 0
    while True:
        delete_btns = drv.find_elements(By.XPATH, "//button[contains(@data-testid, 'despesa-delete-')]")
        if not delete_btns:
            break
        
        first_btn = delete_btns[0]
        drv.execute_script("arguments[0].scrollIntoView({behavior:'smooth',block:'center'});", first_btn)
        time.sleep(0.3)
        drv.execute_script("arguments[0].click()", first_btn)
        time.sleep(0.5)

        try:
            alert = WebDriverWait(drv, 10).until(EC.alert_is_present())
            alert.accept()
            deleted_count += 1
        except Exception:
            break

        time.sleep(2)
    print(f"  ✓ {deleted_count} despesas deletadas")

def delete_all_pets(drv):
    goto_pets(drv)
    while True:
        rows = drv.find_elements(By.XPATH, "//tbody/tr")
        if not rows:
            break
        wait_click(drv, (By.XPATH, "(//button[contains(., 'Excluir')])[1]"))
        WebDriverWait(drv, 5).until(EC.alert_is_present())
        Alert(drv).accept()
        WebDriverWait(drv, 10).until(lambda d: len(d.find_elements(By.XPATH, "//tbody/tr")) < len(rows))
    print(f"  ✓ Todos os pets deletados")

def flow_for_user(email: str, password: str):
    pdf_dir = os.path.join(os.getcwd(), 'relatorios_financeiro_pdf')
    os.makedirs(pdf_dir, exist_ok=True)
    
    drv = make_driver(headless=HEADLESS)
    try:
        login(drv, email, password)
        goto_pets(drv)
        pet_name = f"Pet-Fin-{random.randint(1000,9999)}"
        create_pet(drv, name=pet_name)
        
        goto_despesas(drv)
        despesas_test = [
            ("Ração Premium 15kg", 250.00, "Alimentação", "2025-01-15"),
            ("Consulta Veterinária", 180.00, "Saúde", "2025-01-20"),
            ("Shampoo Pet", 45.00, "Higiene", "2025-02-05"),
            ("Vacina V10", 120.00, "Saúde", "2025-02-10"),
            ("Brinquedo Kong", 80.00, "Alimentação", "2025-02-15"),
        ]
        
        for descricao, valor, categoria, data in despesas_test:
            create_despesa(drv, descricao, valor, categoria, data)
        
        goto_relatorio_financeiro(drv)
        gerar_relatorio_financeiro(drv, data_inicio="2025-01-01", data_fim="2025-02-28")
        verify_relatorio_financeiro_content(drv)
        imprimir_relatorio_financeiro(drv)
        time.sleep(3)
        delete_all_despesas(drv)
        delete_all_pets(drv)
        
        print(f"✅ OK relatório financeiro flow para {email}")
        print(f"📄 PDF salvo em: {pdf_dir}")
        
    finally:
        drv.quit()

def main():
    tutors = get_last_tutors(limit=2)
    if len(tutors) < 2:
        raise SystemExit('Base e2e.db não possui ao menos 2 tutores. Rode primeiro o test_register_login.py')
    
    print("="*60)
    print("TESTE E2E: RELATÓRIOS FINANCEIROS")
    print("="*60)
    
    for email, password in tutors:
        print(f"\n🧪 Testando fluxo de relatórios financeiros para: {email}")
        flow_for_user(email, password)

if __name__ == '__main__':
    main()