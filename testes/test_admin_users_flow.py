import os
import time
import random
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.alert import Alert
from selenium.webdriver.common.keys import Keys
from selenium.common.exceptions import NoAlertPresentException, TimeoutException

BASE_URL = os.getenv('MEUPET_BASE_URL', 'http://localhost:5173')
HEADLESS = os.getenv('MEUPET_HEADLESS', '0') != '0'
DELAY = float(os.getenv('MEUPET_E2E_DELAY', '0.5'))

ADMIN_EMAIL = os.getenv('MEUPET_ADMIN_EMAIL', 'admin@gmail.com')
ADMIN_PWD = os.getenv('MEUPET_ADMIN_PWD', 'Modejudu@33')


def make_driver(headless=True):
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


def random_cpf():
  d = str(random.randint(10**10, 10**11 - 1))
  return f"{d[:3]}.{d[3:6]}.{d[6:9]}-{d[9:11]}"


def random_phone():
  ddd = random.randint(11, 99)
  p1 = random.randint(10000, 99999)
  p2 = random.randint(1000, 9999)
  return f"({ddd}) {p1}-{p2}"


def login_admin(drv):
  drv.get(f"{BASE_URL}/login")
  wait_type(drv, (By.CSS_SELECTOR, "input[type='email']"), ADMIN_EMAIL)
  wait_type(drv, (By.CSS_SELECTOR, "input[type='password']"), ADMIN_PWD)
  wait_click(drv, (By.XPATH, "//button[normalize-space()='Entrar']"))
  WebDriverWait(drv, 15).until(EC.url_matches(r".*/$"))


def goto_admin_users(drv):
  try:
    el = WebDriverWait(drv, 8).until(EC.visibility_of_element_located((By.CSS_SELECTOR, "a[data-testid='nav-admin-users']")))
    drv.execute_script("arguments[0].click()", el)
  except Exception:
    drv.get(f"{BASE_URL}/admin/users")
  WebDriverWait(drv, 10).until(EC.url_contains('/admin/users'))


def open_create_user_modal(drv):
  btn = WebDriverWait(drv, 10).until(EC.visibility_of_element_located((By.CSS_SELECTOR, "button[data-testid='btn-open-admin-user-modal']")))
  drv.execute_script("arguments[0].scrollIntoView({behavior:'instant',block:'center'});", btn)
  drv.execute_script("arguments[0].click()", btn)
  WebDriverWait(drv, 10).until(EC.visibility_of_element_located((By.CSS_SELECTOR, "[data-testid='admin-user-modal']")))
  time.sleep(DELAY)


def create_user(drv, name: str, email: str, cpf: str, phone: str):
  open_create_user_modal(drv)
  wait_type(drv, (By.CSS_SELECTOR, "input[data-testid='admin-user-name']"), name)
  wait_type(drv, (By.CSS_SELECTOR, "input[data-testid='admin-user-cpf']"), cpf)
  # type default is Tutor
  wait_type(drv, (By.CSS_SELECTOR, "input[data-testid='admin-user-email']"), email)
  wait_type(drv, (By.CSS_SELECTOR, "input[data-testid='admin-user-phone']"), phone)
  wait_type(drv, (By.CSS_SELECTOR, "input[data-testid='admin-user-password']"), 'Senha@123A')
  submit = WebDriverWait(drv, 10).until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button[data-testid='admin-user-submit']")))
  drv.execute_script("arguments[0].click()", submit)
  WebDriverWait(drv, 10).until(EC.invisibility_of_element_located((By.CSS_SELECTOR, "[data-testid='admin-user-modal']")))
  # aguarda a linha pelo email
  WebDriverWait(drv, 10).until(EC.presence_of_element_located((By.XPATH, f"//tbody//td[normalize-space()='{email}']")))
  time.sleep(DELAY)


def edit_user_email_suffix(drv, email: str):
  row = WebDriverWait(drv, 10).until(EC.presence_of_element_located((By.XPATH, f"//tbody//tr[td[normalize-space()=\"{email}\"]]")))
  # tenta por data-testid primeiro
  try:
    edit_btn = row.find_element(By.XPATH, ".//button[starts-with(@data-testid,'admin-edit-')]")
  except Exception:
    edit_btn = row.find_element(By.XPATH, ".//button[contains(., 'Editar')]")
  drv.execute_script("arguments[0].scrollIntoView({block:'center'});", edit_btn)
  drv.execute_script("arguments[0].click()", edit_btn)
  time.sleep(DELAY)
  # altera endereço só para validar edição
  addr = WebDriverWait(drv, 10).until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[data-testid='admin-user-address']")))
  addr.clear(); addr.send_keys('Rua Teste, 123')
  submit = WebDriverWait(drv, 10).until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button[data-testid='admin-user-submit']")))
  drv.execute_script("arguments[0].click()", submit)
  time.sleep(DELAY)
  WebDriverWait(drv, 10).until(EC.invisibility_of_element_located((By.CSS_SELECTOR, "[data-testid='admin-user-modal']")))


def delete_user(drv, email: str):
  xpath_row = f"//tbody//tr[td[normalize-space()=\"{email}\"]]"
  row = WebDriverWait(drv, 10).until(EC.presence_of_element_located((By.XPATH, xpath_row)))
  try:
    del_btn = row.find_element(By.XPATH, ".//button[starts-with(@data-testid,'admin-delete-')]")
  except Exception:
    del_btn = row.find_element(By.XPATH, ".//button[contains(., 'Excluir')]")
  drv.execute_script("arguments[0].scrollIntoView({block:'center'});", del_btn)
  drv.execute_script("arguments[0].click()", del_btn)
  time.sleep(DELAY)
  try:
    WebDriverWait(drv, 8).until(EC.alert_is_present())
    Alert(drv).accept()
  except TimeoutException:
    # fallback: enviar ENTER para confirmar
    try:
      drv.switch_to.alert.accept()
    except NoAlertPresentException:
      drv.find_element(By.TAG_NAME, 'body').send_keys(Keys.ENTER)
  time.sleep(DELAY)
  time.sleep(DELAY)
  # aguarda a linha sumir
  WebDriverWait(drv, 10).until(lambda d: len(d.find_elements(By.XPATH, xpath_row)) == 0)


def main():
  drv = make_driver(headless=HEADLESS)
  try:
    login_admin(drv)
    goto_admin_users(drv)
    created_emails = []
    # criar 5 usuários Tutor
    for i in range(5):
      email = f"tutor-admin-{int(time.time())}-{random.randint(1000,9999)}@mailinator.com"
      create_user(drv, name=f"Tutor Admin {i+1}", email=email, cpf=random_cpf(), phone=random_phone())
      created_emails.append(email)

    # editar (alterar endereço)
    for email in created_emails:
      edit_user_email_suffix(drv, email)

    # excluir
    for email in created_emails:
      delete_user(drv, email)

    print('Admin users flow OK')
  finally:
    drv.quit()


if __name__ == '__main__':
  main()


