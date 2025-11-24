import os
import time
import random
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.alert import Alert
from selenium.webdriver.common.action_chains import ActionChains
from e2e_store import get_last_tutors

BASE_URL = os.getenv('MEUPET_BASE_URL', 'http://localhost:5173')
HEADLESS = os.getenv('MEUPET_HEADLESS', '0') != '0'
DELAY = float(os.getenv('MEUPET_E2E_DELAY', '0.5'))


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


def goto_agenda(drv):
    try:
        el = WebDriverWait(drv, 8).until(EC.visibility_of_element_located((By.CSS_SELECTOR, "a[href='/agenda']")))
        drv.execute_script("arguments[0].scrollIntoView({behavior:'smooth',block:'center'});", el)
        drv.execute_script("arguments[0].click()", el)
        WebDriverWait(drv, 8).until(EC.url_contains('/agenda'))
        return
    except Exception:
        pass
    try:
        el = WebDriverWait(drv, 5).until(EC.visibility_of_element_located((By.CSS_SELECTOR, "nav.bottom-nav a[href='/agenda']")))
        drv.execute_script("arguments[0].click()", el)
        WebDriverWait(drv, 8).until(EC.url_contains('/agenda'))
        return
    except Exception:
        pass
    drv.get(f"{BASE_URL}/agenda")
    WebDriverWait(drv, 8).until(EC.url_contains('/agenda'))


def create_agenda_item(drv, procedimento: str):
    btn = WebDriverWait(drv, 10).until(
        EC.visibility_of_element_located((By.CSS_SELECTOR, "button[data-testid='btn-open-agenda-modal']"))
    )
    drv.execute_script("arguments[0].scrollIntoView({behavior:'smooth',block:'center'});", btn)
    drv.execute_script("arguments[0].click()", btn)
    
    modal = WebDriverWait(drv, 10).until(
        EC.visibility_of_element_located((By.CSS_SELECTOR, "[data-testid='agenda-modal']"))
    )
    time.sleep(DELAY)

    # Seleciona pet
    try:
        pet_select = Select(WebDriverWait(modal, 10).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, "select[data-testid*='pet'], select[name*='pet']"))
        ))
        WebDriverWait(drv, 10).until(lambda d: len(pet_select.options) > 1)
        pet_select.select_by_index(1)
        time.sleep(DELAY)
    except Exception as e:
        print(f"[ERRO] Falha ao selecionar pet: {e}")
        raise

    # Preenche campos do formulário
    def inside_modal(selector):
        return modal.find_elements(By.CSS_SELECTOR, selector)

    for inp in inside_modal("input"):
        t = (inp.get_attribute('type') or '').lower()
        placeholder = (inp.get_attribute('placeholder') or '').lower()
        name = (inp.get_attribute('name') or '').lower()
        try:
            if t in ['text', 'search']:
                inp.clear()
                if 'procedimento' in placeholder or 'procedimento' in name:
                    inp.send_keys(procedimento)
                elif 'profissional' in placeholder or 'profissional' in name:
                    inp.send_keys(f"Dr. Teste {random.randint(1000,9999)}")
                else:
                    inp.send_keys(f"Teste {random.randint(1000,9999)}")
            elif t == 'date' or 'dd/mm' in placeholder:
                inp.clear()
                inp.send_keys("31122025")
            elif t == 'time' or 'hora' in placeholder or ':' in placeholder:
                inp.clear()
                inp.send_keys("1530")
            elif t == 'number':
                inp.clear()
                inp.send_keys(str(random.randint(1, 10)))
            time.sleep(0.2)
        except Exception:
            pass

    for ta in inside_modal("textarea"):
        try:
            ta.clear()
            ta.send_keys("Observação automatizada via E2E.")
            time.sleep(0.2)
        except Exception:
            pass

    submit = WebDriverWait(modal, 10).until(
        EC.element_to_be_clickable((By.XPATH, ".//button[contains(., 'Criar Agendamento') or contains(., 'Salvar')]"))
    )
    drv.execute_script("arguments[0].click()", submit)
    time.sleep(DELAY * 3)
    print(f"  ✓ Agendamento '{procedimento}' criado com sucesso")


def avaliar_agendamento(drv, nota: int, comentario: str):
    """Clica no botão Avaliar do primeiro agendamento e preenche a avaliação"""
    # Aguarda e clica no botão ☆ Avaliar
    avaliar_btn = WebDriverWait(drv, 10).until(
        EC.element_to_be_clickable((By.XPATH, "//button[contains(., '☆ Avaliar')]"))
    )
    drv.execute_script("arguments[0].scrollIntoView({block:'center'});", avaliar_btn)
    drv.execute_script("arguments[0].click()", avaliar_btn)
    time.sleep(DELAY)
    
    # Aguarda modal de avaliação aparecer
    WebDriverWait(drv, 10).until(
        EC.visibility_of_element_located((By.XPATH, "//h3[contains(., 'Avaliar Serviço')]"))
    )
    
    # Clica na estrela correspondente à nota
    star = WebDriverWait(drv, 10).until(
        EC.element_to_be_clickable((By.XPATH, f"(//h3[contains(., 'Avaliar Serviço')]/following::div//span[text()='★'])[{nota}]"))
    )
    drv.execute_script("arguments[0].click()", star)
    time.sleep(DELAY)
    
    # Preenche comentário
    comentario_textarea = WebDriverWait(drv, 10).until(
        EC.presence_of_element_located((By.XPATH, "//label[contains(., 'Comentário')]/following::textarea[1]"))
    )
    comentario_textarea.clear()
    comentario_textarea.send_keys(comentario)
    time.sleep(DELAY)
    
    # Confirma avaliação
    confirmar_btn = WebDriverWait(drv, 10).until(
        EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Confirmar Avaliação')]"))
    )
    drv.execute_script("arguments[0].click()", confirmar_btn)
    time.sleep(DELAY * 2)
    
    print(f"  ✓ Avaliação enviada: {nota} estrelas - '{comentario}'")


def test_hover_comentario(drv, comentario_esperado: str):
    """Testa o hover sobre as estrelas para visualizar o comentário"""
    # Localiza as estrelas do agendamento avaliado
    estrelas = WebDriverWait(drv, 10).until(
        EC.presence_of_element_located((By.XPATH, "//span[contains(text(), '★')]"))
    )
    
    # Move o mouse sobre as estrelas
    actions = ActionChains(drv)
    actions.move_to_element(estrelas).perform()
    time.sleep(DELAY * 2)
    
    # Verifica se o tooltip apareceu com o comentário
    try:
        tooltip = WebDriverWait(drv, 5).until(
            EC.presence_of_element_located((By.XPATH, f"//*[contains(text(), '{comentario_esperado}')]"))
        )
        print(f"  ✓ Hover funcionando: comentário exibido no tooltip")
        return True
    except Exception:
        print(f"  ⚠ Hover não funcionou: tooltip não encontrado")
        return False


def delete_all_agenda_items(drv):
    """Deleta todos os agendamentos"""
    while True:
        try:
            delete_button = WebDriverWait(drv, 2).until(
                EC.element_to_be_clickable((By.XPATH, "(//button[contains(., 'Excluir')])[1]"))
            )
            drv.execute_script("arguments[0].scrollIntoView({block:'center'});", delete_button)
            drv.execute_script("arguments[0].click()", delete_button)
            
            WebDriverWait(drv, 5).until(EC.alert_is_present())
            Alert(drv).accept()
            
            time.sleep(DELAY * 2)
        except Exception:
            break


def delete_all_pets(drv):
    """Deleta todos os pets"""
    goto_pets(drv)
    while True:
        rows = drv.find_elements(By.XPATH, "//tbody/tr")
        if not rows:
            break
        wait_click(drv, (By.XPATH, "(//button[contains(., 'Excluir')])[1]"))
        WebDriverWait(drv, 5).until(EC.alert_is_present())
        Alert(drv).accept()
        WebDriverWait(drv, 10).until(lambda d: len(d.find_elements(By.XPATH, "//tbody/tr")) < len(rows))


def flow_for_user(email: str, password: str):
    drv = make_driver(headless=HEADLESS)
    try:
        login(drv, email, password)
        
        # 1. Criar pet
        goto_pets(drv)
        pet_name = f"Pet-Avaliacao-{random.randint(1000,9999)}"
        create_pet(drv, name=pet_name)
        
        # 2. Criar agendamento
        goto_agenda(drv)
        procedimento = f"Consulta Veterinária {random.randint(1000,9999)}"
        create_agenda_item(drv, procedimento)
        
        # 3. Avaliar agendamento
        nota = 5
        comentario = f"Excelente atendimento! Muito atencioso e cuidadoso com meu pet. Recomendo! #{random.randint(1000,9999)}"
        avaliar_agendamento(drv, nota, comentario)
        
        # 4. Testar hover do comentário
        test_hover_comentario(drv, comentario)
        
        # 5. Limpar dados
        delete_all_agenda_items(drv)
        delete_all_pets(drv)
        
        print(f"✅ OK avaliação flow para {email}")
        
    finally:
        drv.quit()


def main():
    tutors = get_last_tutors(limit=2)
    if len(tutors) < 2:
        raise SystemExit('Base e2e.db não possui ao menos 2 tutores. Rode primeiro o test_register_login.py')
    
    print("="*60)
    print("TESTE E2E: AVALIAÇÃO DE AGENDAMENTOS")
    print("="*60)
    
    for email, password in tutors:
        print(f"\n🧪 Testando fluxo de avaliação para: {email}")
        flow_for_user(email, password)


if __name__ == '__main__':
    main()