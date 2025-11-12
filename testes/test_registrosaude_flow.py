import os
import time
import random
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.alert import Alert
from selenium.webdriver.common.keys import Keys
from e2e_store import get_last_tutors
from pathlib import Path

BASE_URL = os.getenv('MEUPET_BASE_URL', 'http://localhost:5173')
HEADLESS = os.getenv('MEUPET_HEADLESS', '1') != '0'
DELAY = float(os.getenv('MEUPET_E2E_DELAY', '0.5'))

def make_driver(headless: bool = True):
  options = webdriver.ChromeOptions()
  if headless:
    options.add_argument('--headless=new')
  options.add_argument('--window-size=1366,900')
  return webdriver.Chrome(options=options)

def wait_click(drv, locator, timeout=15):
  el = WebDriverWait(drv, timeout).until(EC.element_to_be_clickable(locator))
  drv.execute_script("arguments[0].scrollIntoView({behavior:'smooth',block:'center'});", el)
  drv.execute_script("arguments[0].click();", el)
  time.sleep(DELAY)
  return el

def fill_date_input(drv, css_selector: str, day: int, month: int, year: int, timeout: int = 15):
  el = WebDriverWait(drv, timeout).until(EC.presence_of_element_located((By.CSS_SELECTOR, css_selector)))
  # Try hard clear to handle masked inputs
  el.click()
  el.send_keys(Keys.CONTROL, 'a')
  el.send_keys(Keys.DELETE)
  t = (el.get_attribute('type') or '').lower()
  placeholder = (el.get_attribute('placeholder') or '').lower()
  if t == 'date':
    el.send_keys(f"{year:04d}-{month:02d}-{day:02d}")
  else:
    # Most masks accept only digits; slashes are added automatically
    el.send_keys(f"{day:02d}{month:02d}{year:04d}")
  time.sleep(DELAY)
  return el

def fill_time_input(drv, css_selector: str, hour: int, minute: int, timeout: int = 15):
  el = WebDriverWait(drv, timeout).until(EC.presence_of_element_located((By.CSS_SELECTOR, css_selector)))
  el.click()
  el.send_keys(Keys.CONTROL, 'a')
  el.send_keys(Keys.DELETE)
  t = (el.get_attribute('type') or '').lower()
  placeholder = (el.get_attribute('placeholder') or '').lower()
  if t == 'time':
    el.send_keys(f"{hour:02d}:{minute:02d}")
  else:
    # Text inputs with time masks usually accept digits only
    el.send_keys(f"{hour:02d}{minute:02d}")
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

def create_dummy_file(name: str) -> str:
  p = Path(__file__).parent / name
  p.write_bytes(b'fake file for selenium upload tests')
  return str(p)

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

def delete_all_pets(drv):
  goto_pets(drv)
  time.sleep(1)
  while True:
    rows = drv.find_elements(By.XPATH, "//tbody/tr")
    if not rows:
      break
    delete_btn = WebDriverWait(drv, 5).until(EC.element_to_be_clickable((By.XPATH, "(//button[contains(., 'Excluir')])[1]")))
    drv.execute_script("arguments[0].scrollIntoView({block:'center'});", delete_btn)
    try:
      drv.execute_script("arguments[0].click();", delete_btn)
    except Exception:
      time.sleep(1)
      drv.execute_script("arguments[0].click();", delete_btn)
    WebDriverWait(drv, 5).until(EC.alert_is_present())
    Alert(drv).accept()
    WebDriverWait(drv, 10).until(lambda d: len(d.find_elements(By.XPATH, "//tbody/tr")) < len(rows))

def goto_registrosaude(drv):
  try:
    link = WebDriverWait(drv, 15).until(EC.visibility_of_element_located((By.CSS_SELECTOR, "a[href='/registros-saude']")))
    drv.execute_script("arguments[0].scrollIntoView({behavior:'smooth',block:'center'});", link)
    drv.execute_script("arguments[0].click()", link)
  except Exception:
    try:
      link = WebDriverWait(drv, 10).until(EC.visibility_of_element_located((By.CSS_SELECTOR, "nav.bottom-nav a[href='/registros-saude']")))
      drv.execute_script("arguments[0].click()", link)
    except Exception:
      drv.get(f"{BASE_URL}/registros-saude")
  WebDriverWait(drv, 20).until(lambda d: '/registros-saude' in d.current_url)

def create_registro(drv, title: str):
  try:
    btn = WebDriverWait(drv, 20).until(EC.any_of(
      EC.visibility_of_element_located((By.XPATH, "//button[contains(., 'Novo')]")),
      EC.visibility_of_element_located((By.XPATH, "//button[contains(., 'Adicionar')]")),
      EC.visibility_of_element_located((By.CSS_SELECTOR, "button[data-testid*='registro']"))
    ))
  except Exception:
    raise SystemExit("❌ Botão de criar registro não encontrado na página /registros-saude")
  drv.execute_script("arguments[0].scrollIntoView({behavior:'smooth',block:'center'});", btn)
  drv.execute_script("arguments[0].click()", btn)
  pet_select_el = WebDriverWait(drv, 20).until(EC.presence_of_element_located((By.CSS_SELECTOR, "select[data-testid='registro-pet']")))
  WebDriverWait(drv, 30).until(lambda d: (d.find_element(By.CSS_SELECTOR, "select[data-testid='registro-pet']").get_attribute('disabled') in [None, 'false']) and len(Select(d.find_element(By.CSS_SELECTOR, "select[data-testid='registro-pet']")).options) > 1)
  pet_select = Select(drv.find_element(By.CSS_SELECTOR, "select[data-testid='registro-pet']"))
  pet_select.select_by_index(1)
  time.sleep(DELAY)
  tipo_sel_el = WebDriverWait(drv, 20).until(EC.presence_of_element_located((By.CSS_SELECTOR, "select[data-testid='registro-tipo']")))
  try:
    WebDriverWait(drv, 10).until(lambda d: d.find_element(By.CSS_SELECTOR, "select[data-testid='registro-tipo']").get_attribute('disabled') in [None, 'false'])
    tipo_select = Select(drv.find_element(By.CSS_SELECTOR, "select[data-testid='registro-tipo']"))
    found = False
    for opt in tipo_select.options:
      if "vacina" in opt.text.lower():
        tipo_select.select_by_visible_text(opt.text)
        found = True
        break
    if not found and len(tipo_select.options) > 1:
      tipo_select.select_by_index(1)
  except Exception:
    pass
  tipo_select_after = Select(drv.find_element(By.CSS_SELECTOR, "select[data-testid='registro-tipo']"))
  selected_text = tipo_select_after.first_selected_option.text.lower()
  if "vacina" not in selected_text:
    raise SystemExit("❌ Tipo de registro não foi selecionado como 'Vacina' — abortando para evitar DeletionNotAllowed.")
  fill_date_input(drv, "input[data-testid='registro-data']", day=25, month=12, year=2025)
  fill_time_input(drv, "input[data-testid='registro-horario']", hour=15, minute=30)
  wait_type(drv, (By.CSS_SELECTOR, "input[data-testid='registro-profissional']"), "Dr. Teste Automatizado")
  try:
    dummy_doc = create_dummy_file("arquivo_teste.pdf")
    file_input = drv.find_element(By.CSS_SELECTOR, "input[type='file']")
    file_input.send_keys(dummy_doc)
  except Exception:
    pass
  submit = WebDriverWait(drv, 10).until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button[data-testid='registro-submit']")))
  drv.execute_script("arguments[0].click()", submit)
  WebDriverWait(drv, 10).until_not(EC.presence_of_element_located((By.CSS_SELECTOR, "button[data-testid='registro-submit'][disabled]")))
  time.sleep(DELAY * 3)

def edit_first_registro(drv):
  btn = WebDriverWait(drv, 10).until(EC.element_to_be_clickable((By.XPATH, "(//button[contains(., 'Editar')])[1]")))
  drv.execute_script("arguments[0].scrollIntoView({block:'center'});", btn)
  drv.execute_script("arguments[0].click()", btn)
  new_prof = f"Dr. Editado {random.randint(1000,9999)}"
  wait_type(drv, (By.CSS_SELECTOR, "input[data-testid='registro-profissional']"), new_prof)
  fill_date_input(drv, "input[data-testid='registro-data']", day=31, month=12, year=2025)
  fill_time_input(drv, "input[data-testid='registro-horario']", hour=10, minute=45)
  submit = WebDriverWait(drv, 10).until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button[data-testid='registro-submit']")))
  drv.execute_script("arguments[0].click()", submit)
  WebDriverWait(drv, 10).until(EC.presence_of_element_located((By.XPATH, f"//*[contains(text(), '{new_prof}')]")))
  print(f"✏️ Registro editado com sucesso — Profissional: {new_prof}, Data: 2025-12-31, Horário: 10:45")

def delete_all_registros(drv):
  while True:
    try:
      delete_button = WebDriverWait(drv, 2).until(EC.element_to_be_clickable((By.XPATH, "(//button[contains(., 'Excluir')])[1]")))
      drv.execute_script("arguments[0].scrollIntoView({block:'center'});", delete_button)
      drv.execute_script("arguments[0].click()", delete_button)
      WebDriverWait(drv, 5).until(EC.alert_is_present())
      Alert(drv).accept()
      time.sleep(DELAY * 2)
    except Exception:
      break

def flow_for_user(email: str, password: str):
  drv = make_driver(headless=HEADLESS)
  try:
    login(drv, email, password)
    goto_pets(drv)
    for i in range(2):
      create_pet(drv, name=f"Pet-{random.randint(1000,9999)}")
    goto_registrosaude(drv)
    for i in range(2):
      create_registro(drv, title=f"Vacina V10 {i+1}-{random.randint(1000,9999)}")
    edit_first_registro(drv)
    delete_all_registros(drv)
    delete_all_pets(drv)
    print(f"✅ Registro de saúde flow finalizado com sucesso para {email}")
  finally:
    drv.quit()

def main():
  tutors = get_last_tutors(limit=2)
  if len(tutors) < 2:
    raise SystemExit('Base e2e.db não possui ao menos 2 tutores. Rode primeiro o test_register_login.py')
  for email, password in tutors:
    flow_for_user(email, password)

if __name__ == '__main__':
  main()
