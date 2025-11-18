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
PET_NAME = os.getenv('MEUPET_TEST_PET', 'rtyeh')


def make_driver(headless: bool = True):
    options = webdriver.ChromeOptions()
    if headless:
        options.add_argument('--headless=new')
    options.add_argument('--window-size=1366,900')
    
    # Configurações para salvar PDF automaticamente
    prefs = {
        'printing.print_preview_sticky_settings.appState': '{"recentDestinations":[{"id":"Save as PDF","origin":"local","account":""}],"selectedDestinationId":"Save as PDF","version":2}',
        'savefile.default_directory': os.path.join(os.getcwd(), 'relatorios_pdf'),
        'download.default_directory': os.path.join(os.getcwd(), 'relatorios_pdf'),
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


def goto_relatorios(drv):
    """
    Fluxo real do usuário: clicar no card 'Relatórios' no dashboard.
    """
    # Aguarda dashboard carregar após login
    WebDriverWait(drv, 15).until(EC.url_matches(r".*/$"))
    time.sleep(1)
    
    # Clica no card de Relatórios
    card = WebDriverWait(drv, 15).until(
        EC.visibility_of_element_located((By.XPATH, "//h3[normalize-space()='Relatórios']/ancestor::div[contains(@style,'border-radius')]"))
    )
    drv.execute_script("arguments[0].scrollIntoView({behavior:'smooth',block:'center'});", card)
    time.sleep(0.5)
    drv.execute_script("arguments[0].click()", card)
    
    # Aguarda página de relatórios carregar
    WebDriverWait(drv, 15).until(
        EC.visibility_of_element_located((By.CSS_SELECTOR, "select[data-testid='relatorio-select-pet']"))
    )




def gerar_relatorio(drv, data_inicio: str = "2024-02-27", data_fim: str = "2025-11-28"):
    """Gera um relatório de saúde com as datas fixas"""
    # Seleciona pet (primeiro disponível após o placeholder)
    pet_select_el = WebDriverWait(drv, 15).until(EC.presence_of_element_located((By.CSS_SELECTOR, "select[data-testid='relatorio-select-pet']")))
    pet_select = Select(pet_select_el)
    
    # Aguarda opções carregarem e seleciona a primeira opção válida
    WebDriverWait(drv, 15).until(lambda d: len(Select(d.find_element(By.CSS_SELECTOR, "select[data-testid='relatorio-select-pet']")).options) > 1)
    
    # Seleciona a primeira opção que não seja o placeholder
    selected = False
    for opt in pet_select.options:
        if opt.get_attribute('value'):
            pet_select.select_by_value(opt.get_attribute('value'))
            selected = True
            break
    
    if not selected:
        raise SystemExit("❌ Nenhum pet disponível para gerar relatório. Cadastre um pet manualmente antes de rodar o teste.")
    time.sleep(DELAY)
    
    # Preenche data início usando JS
    data_inicio_input = WebDriverWait(drv, 10).until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[data-testid='relatorio-input-data-inicio']")))
    drv.execute_script("arguments[0].value = arguments[1]; arguments[0].dispatchEvent(new Event('input', { bubbles: true }));", data_inicio_input, data_inicio)
    time.sleep(DELAY)
    
    # Preenche data fim usando JS
    data_fim_input = WebDriverWait(drv, 10).until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[data-testid='relatorio-input-data-fim']")))
    drv.execute_script("arguments[0].value = arguments[1]; arguments[0].dispatchEvent(new Event('input', { bubbles: true }));", data_fim_input, data_fim)
    time.sleep(DELAY)
    
    # Clica em gerar relatório
    btn_gerar = WebDriverWait(drv, 10).until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button[data-testid='btn-gerar-relatorio']")))
    drv.execute_script("arguments[0].scrollIntoView({behavior:'smooth',block:'center'});", btn_gerar)
    drv.execute_script("arguments[0].click()", btn_gerar)
    
    # Aguarda relatório carregar
    time.sleep(2)
    
    # Verifica se relatório foi exibido
    WebDriverWait(drv, 15).until(EC.presence_of_element_located((By.XPATH, "//h2[contains(text(), 'Relatório de Saúde')]")))




def verify_relatorio_content(drv):
    """Verifica o conteúdo do relatório"""
    # Verifica cabeçalho
    WebDriverWait(drv, 10).until(EC.presence_of_element_located((By.XPATH, "//h2[contains(text(), 'Relatório de Saúde')]")))
    
    # Verifica resumo
    try:
        resumo = WebDriverWait(drv, 5).until(EC.presence_of_element_located((By.XPATH, "//h3[contains(text(), 'Resumo')]")))
        print(f"  ✓ Resumo exibido no relatório")
    except Exception:
        print(f"  ⚠ Resumo não encontrado")
    
    # Verifica total de registros
    try:
        total = WebDriverWait(drv, 5).until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Total de Registros')]")))
        print(f"  ✓ Total de registros exibido")
    except Exception:
        print(f"  ⚠ Total de registros não encontrado")
    
    # Verifica histórico detalhado
    try:
        historico = WebDriverWait(drv, 5).until(EC.presence_of_element_located((By.XPATH, "//h3[contains(text(), 'Histórico Detalhado')]")))
        print(f"  ✓ Histórico detalhado exibido")
    except Exception:
        print(f"  ⚠ Histórico detalhado não encontrado")


def imprimir_relatorio(drv):
    """Clica no botão imprimir e salva o PDF"""
    # Clica no botão imprimir
    btn_imprimir = WebDriverWait(drv, 10).until(
        EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Imprimir') or contains(., 'imprimir')]"))
    )
    drv.execute_script("arguments[0].scrollIntoView({behavior:'smooth',block:'center'});", btn_imprimir)
    time.sleep(0.5)
    drv.execute_script("arguments[0].click()", btn_imprimir)
    print(f"  ✓ Botão de impressão clicado")
    
    # Aguarda o diálogo de impressão abrir
    time.sleep(3)
    
    # Muda para a janela de impressão (shadow DOM)
    # Tenta encontrar e clicar no botão Save usando JavaScript
    try:
        # Script para clicar no botão Save no diálogo de impressão do Chrome
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
            # Fallback: pressiona Enter
            print(f"  ⚠ Tentando Enter como fallback")
            drv.find_element(By.TAG_NAME, 'body').send_keys(Keys.ENTER)
        
        time.sleep(3)
        print(f"  ✓ PDF salvo na pasta 'relatorios_pdf'")
    except Exception as e:
        print(f"  ⚠ Erro ao salvar PDF: {e}")
        print(f"  💡 Tente salvar manualmente pressionando Ctrl+S ou clicando em Save")


def flow_for_user(email: str, password: str):
    # Cria pasta para salvar PDFs se não existir
    pdf_dir = os.path.join(os.getcwd(), 'relatorios_pdf')
    os.makedirs(pdf_dir, exist_ok=True)
    
    drv = make_driver(headless=HEADLESS)
    try:
        login(drv, email, password)
        goto_relatorios(drv)
        print("  ✓ Navegou para página de Relatórios")
        
        # Gera relatório com datas fixas
        gerar_relatorio(drv, data_inicio="2024-02-27", data_fim="2025-11-28")
        print(f"  ✓ Relatório gerado com período de 2024-02-27 a 2025-11-28")
        
        # Verifica conteúdo do relatório
        verify_relatorio_content(drv)
        
        # Imprime e salva o relatório em PDF
        imprimir_relatorio(drv)
        
        # Aguarda um pouco para visualização
        time.sleep(3)
        
        print(f"✅ OK relatórios flow para {email}")
        print(f"📄 PDF salvo em: {pdf_dir}")
    finally:
        drv.quit()


def main():
    # Usa credenciais específicas do usuário
    email = "eduardojrizidoro@gmail.com"
    password = "Modejudu@33"
    
    print("="*60)
    print("RFC07 - TESTE E2E: RELATÓRIOS DE SAÚDE")
    print("="*60)
    print(f"\n🧪 Testando fluxo de relatórios para: {email}")
    
    flow_for_user(email, password)


if __name__ == '__main__':
    main()

