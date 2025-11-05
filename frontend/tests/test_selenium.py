from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

navegador = webdriver.Chrome()
waiter = WebDriverWait(navegador, 5)

navegador.get("http://localhost:5173/")

navegador.maximize_window()

navegador.find_element("class name", "email").send_keys("pedrinho123@gmail.com")
navegador.find_element("class name", "password").send_keys("senha1234")
submit = navegador.find_element("class name", "submit")

# Scroll ate aparecer o botao
navegador.execute_script("arguments[0].scrollIntoView({block: 'center'})", submit)
waiter.until(EC.element_to_be_clickable(submit))

submit.click()


# nao fecha imediatamente depois de terminar
time.sleep(10)