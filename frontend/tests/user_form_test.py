# selenium_user_form.py
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import (
    TimeoutException, StaleElementReferenceException, ElementClickInterceptedException,
    WebDriverException, NoSuchWindowException, NoSuchElementException
)
import time
import os

DEFAULT_WAIT = 12
RETRY_ATTEMPTS = 3
RETRY_SLEEP = 0.25


def session_alive(driver):
    """Checa se a sessão do webdriver parece ativa."""
    try:
        # chamada leve para validar sessão
        _ = driver.session_id
        # tentar acessar um atributo simples
        _ = driver.current_url
        return True
    except Exception:
        return False

def _presence_and_scroll(driver, xpath, timeout=DEFAULT_WAIT):
    """Localiza o elemento (presence), faz scrollIntoView e retorna o elemento mais atualizado."""
    el = WebDriverWait(driver, timeout).until(EC.presence_of_element_located((By.XPATH, xpath)))
    try:
        driver.execute_script("arguments[0].scrollIntoView({block:'center', inline:'nearest'});", el)
    except StaleElementReferenceException:
        # DOM mudou — re-obtenha
        el = WebDriverWait(driver, timeout).until(EC.presence_of_element_located((By.XPATH, xpath)))
        driver.execute_script("arguments[0].scrollIntoView({block:'center', inline:'nearest'});", el)
    # pequeno delay para reflow/animation do React
    time.sleep(0.12)
    return el

def find_visible_clickable(driver, xpath, timeout=DEFAULT_WAIT):
    """Garante que o elemento esteja presente, visível e enable; re-localiza em caso de Stale."""
    el = _presence_and_scroll(driver, xpath, timeout)
    # espera visibilidade
    WebDriverWait(driver, timeout).until(EC.visibility_of(el))
    # espera que esteja habilitado (enabled/displayed)
    WebDriverWait(driver, timeout).until(lambda d: el.is_displayed() and el.is_enabled())
    return el

def safe_click_by_xpath(driver, xpath, timeout=DEFAULT_WAIT):
    """Tenta clicar no elemento indicado pelo xpath com retries e fallback JS click."""
    if not session_alive(driver):
        raise WebDriverException("Sessão do WebDriver inválida (session died).")

    last_exc = None
    for attempt in range(RETRY_ATTEMPTS):
        try:
            el = find_visible_clickable(driver, xpath, timeout)
            try:
                el.click()
                return True
            except ElementClickInterceptedException as e:
                # fallback: JS click
                try:
                    driver.execute_script("arguments[0].click();", el)
                    return True
                except Exception as js_e:
                    last_exc = js_e
                    # continuar para tentar re-localizar
            except StaleElementReferenceException as se:
                last_exc = se
                # re-tentar (DOM mudou)
            except WebDriverException as we:
                last_exc = we
                # se for problema de sessão (ex.: "no such window" ou crash), re-levantar
                if isinstance(we, NoSuchWindowException) or 'session' in str(we).lower():
                    raise
            # se chegou aqui, deu algum problema com o elemento — re-obter e tentar de novo
            time.sleep(RETRY_SLEEP)
        except TimeoutException as te:
            last_exc = te
            time.sleep(RETRY_SLEEP)
        except NoSuchWindowException:
            # janela fechada / session lost — re-levantar para tratamento a nível superior
            raise
    # se esgotaram as tentativas
    raise last_exc or Exception("safe_click falhou sem exceção específica")

def safe_send_keys_by_xpath(driver, xpath, value, timeout=DEFAULT_WAIT):
    """Localiza input (repetindo em caso de stale) e envia keys de forma resiliente."""
    if not session_alive(driver):
        raise WebDriverException("Sessão do WebDriver inválida (session died).")

    last_exc = None
    for attempt in range(RETRY_ATTEMPTS):
        try:
            el = _presence_and_scroll(driver, xpath, timeout)
            WebDriverWait(driver, timeout).until(EC.visibility_of(el))
            el.clear()
            el.send_keys(value)
            return True
        except StaleElementReferenceException as se:
            last_exc = se
            time.sleep(RETRY_SLEEP)
        except (WebDriverException, TimeoutException) as e:
            last_exc = e
            time.sleep(RETRY_SLEEP)
    raise last_exc or Exception("safe_send_keys falhou sem exceção específica")

def capture_diagnostics(driver, name_prefix="diag"):
    """Salva screenshot, page_source, session info e logs de console quando possível."""
    base = os.path.abspath(".")
    suffix = int(time.time())
    screenshots = {}
    try:
        ss = os.path.join(base, f"{name_prefix}_{suffix}.png")
        driver.save_screenshot(ss)
        screenshots['screenshot'] = ss
    except Exception:
        screenshots['screenshot'] = None
    try:
        src = os.path.join(base, f"{name_prefix}_{suffix}.html")
        with open(src, "w", encoding="utf-8") as f:
            f.write(driver.page_source)
        screenshots['page_source'] = src
    except Exception:
        screenshots['page_source'] = None
    try:
        screenshots['current_url'] = driver.current_url
    except Exception:
        screenshots['current_url'] = None
    try:
        screenshots['title'] = driver.title
    except Exception:
        screenshots['title'] = None
    try:
        screenshots['session_id'] = getattr(driver, "session_id", None)
    except Exception:
        screenshots['session_id'] = None
    # tentar logs do browser — pode lançar se driver não suportar
    try:
        logs = driver.get_log("browser")
        log_path = os.path.join(base, f"{name_prefix}_{suffix}_console.log")
        with open(log_path, "w", encoding="utf-8") as f:
            for entry in logs:
                f.write(str(entry) + "\n")
        screenshots['console_log'] = log_path
    except Exception:
        screenshots['console_log'] = None

    return screenshots

def _find_input_by_label_or_placeholder(driver, label_contains=None, placeholder_contains=None, timeout=DEFAULT_WAIT):
    """
    Tenta localizar um <input> usando (1) label text -> following input, (2) placeholder attr.
    Retorna o elemento WebElement ou lança TimeoutException.
    """
    tries = []
    if label_contains:
        # procura label que contenha o texto e pega o primeiro input depois dele no DOM
        xpath_label = f"//label[contains(normalize-space(.),'{label_contains}')]"
        xpath_input_after_label = xpath_label + "/following::input[1]"
        try:
            return find_visible_clickable(driver, xpath_input_after_label, timeout)
        except TimeoutException:
            tries.append(xpath_input_after_label)
    if placeholder_contains:
        xpath_placeholder = f"//input[contains(@placeholder, '{placeholder_contains}')]"
        try:
            return find_visible_clickable(driver, xpath_placeholder, timeout)
        except TimeoutException:
            tries.append(xpath_placeholder)
    # fallback: raise informative TimeoutException
    raise TimeoutException(f"Input not found. Tried: {tries}")

def _select_option_by_text(driver, select_label_text, option_text, timeout=DEFAULT_WAIT):
    # encontra o <select> próximo ao label e escolhe a option pelo texto visível
    select_xpath = f"//label[contains(normalize-space(.),'{select_label_text}')]/following::select[1]"
    sel = find_visible_clickable(driver, select_xpath, timeout)
    # abrir select (se for custom select, mas aqui é um <select> nativo)
    driver.execute_script("arguments[0].scrollIntoView(true);", sel)
    sel.click()
    # clicar a option com texto
    option_xpath = select_xpath + f"/option[normalize-space(text())='{option_text}']"
    opt = find_visible_clickable(driver, option_xpath, timeout)
    opt.click()

def _upload_file_by_label(driver, label_contains, file_path, timeout=DEFAULT_WAIT):
    # encontra input type=file próximo ao label
    xpath = f"//label[contains(normalize-space(.),'{label_contains}')]/following::input[@type='file'][1]"
    file_input = find_visible_clickable(driver, xpath, timeout)
    # send_keys requires caminho absoluto
    if not os.path.isabs(file_path):
        file_path = os.path.abspath(file_path)
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Arquivo para upload não encontrado: {file_path}")
    file_input.send_keys(file_path)
    # pequena espera para React processar
    time.sleep(0.5)

def _click_submit_button(driver, timeout=DEFAULT_WAIT):
    # tenta botão pelo type=submit e texto do botão
    # preferimos clicar no botão habilitado
    try:
        btn = WebDriverWait(driver, timeout).until(
            EC.element_to_be_clickable((By.XPATH, "//button[@type='submit' and not(@disabled)]"))
        )
        driver.execute_script("arguments[0].scrollIntoView(true);", btn)
        btn.click()
        return
    except TimeoutException:
        # como fallback tente botão com texto "Cadastrar" ou "Salvar"
        for txt in ["Cadastrar Usuário", "Salvar Alterações", "✓ Cadastrar Usuário", "✓ Salvar Alterações"]:
            try:
                btn2 = WebDriverWait(driver, 1).until(
                    EC.element_to_be_clickable((By.XPATH, f"//button[contains(normalize-space(.),'{txt}') and not(@disabled)]"))
                )
                driver.execute_script("arguments[0].scrollIntoView(true);", btn2)
                btn2.click()
                return
            except TimeoutException:
                continue
        raise TimeoutException("Botão de submit não encontrado ou está desabilitado.")

def _wait_for_success_message(driver, timeout=DEFAULT_WAIT):
    # procura a div de sucesso (mensagem verde)
    try:
        xpath = "//div[contains(normalize-space(.),'Usuário criado com sucesso') or contains(normalize-space(.),'Usuário atualizado com sucesso')]"
        el = WebDriverWait(driver, timeout).until(EC.visibility_of_element_located((By.XPATH, xpath)))
        return el.text
    except TimeoutException:
        return None

def capture_screenshot(driver, name="selenium_form_error.png"):
    path = os.path.abspath(name)
    try:
        driver.save_screenshot(path)
    except Exception:
        pass
    return path

def fill_and_submit_user_form(driver, user_data: dict, mode: str = "create", wait_after_submit: int = 3):
    """
    Preenche e submete o formulário do componente AdminUserForm.

    Parâmetros:
      - driver: selenium webdriver (assumido já na página onde o form está).
      - user_data: dict com campos:
          {
            "type": "Tutor" or "Veterinário",
            "name": "Nome Completo",
            "cpf": "000.000.000-00",
            "email": "email@dominio.com",
            "phone": "(11) 99999-9999" or "11999999999",
            "password": "senha123",
            # apenas para veterinário:
            "crmv": "CRMV-UF 12345",
            "clinicAddress": "Rua X, 00000-000",
            "professionalIdDoc": "/caminho/para/crmv.pdf",
            "diplomaDoc": "/caminho/para/diploma.pdf",
            # endereço opcional para tutor:
            "address": "Rua, CEP e cidade"
          }
      - mode: "create" ou "edit" (importante para requisitos de arquivos/senha)
      - wait_after_submit: segundos para aguardar mensagens após submit

    Retorna:
      dict {
        "ok": True/False,
        "message": success_message or error message,
        "screenshot": path se houve erro
      }
    """
    try:
        # 1) Preencher Nome
        el = _find_input_by_label_or_placeholder(driver, label_contains="Nome", placeholder_contains="Nome completo")
        el.clear()
        el.send_keys(user_data.get("name", ""))

        # 2) CPF
        el = _find_input_by_label_or_placeholder(driver, label_contains="CPF", placeholder_contains="000.000.000-00")
        el.clear()
        el.send_keys(user_data.get("cpf", ""))

        # 3) Tipo de usuário (select)
        desired_type = user_data.get("type", "Tutor")
        _select_option_by_text(driver, "Tipo de Usuário", desired_type)

        # 4) Se Veterinário, preencher campos CRMV/clinicAddress e fazer upload (no modo create os arquivos são obrigatórios)
        if desired_type == "Veterinário":
            # CRMV
            el = _find_input_by_label_or_placeholder(driver, label_contains="CRMV", placeholder_contains="CRMV")
            el.clear()
            el.send_keys(user_data.get("crmv", ""))

            # Endereço da Clínica
            el = _find_input_by_label_or_placeholder(driver, label_contains="Endereço da Clínica", placeholder_contains="Rua, CEP")
            el.clear()
            el.send_keys(user_data.get("clinicAddress", ""))

            # documentos (file inputs) - só se passados no user_data
            prof_doc = user_data.get("professionalIdDoc")
            dip_doc = user_data.get("diplomaDoc")

            if prof_doc:
                _upload_file_by_label(driver, "Documento de identidade profissional", prof_doc)
            elif mode == "create":
                raise ValueError("professionalIdDoc obrigatório em mode=create para Veterinário")

            if dip_doc:
                _upload_file_by_label(driver, "Diploma/Certificado", dip_doc)
            elif mode == "create":
                raise ValueError("diplomaDoc obrigatório em mode=create para Veterinário")

        # 5) Email
        el = _find_input_by_label_or_placeholder(driver, label_contains="E-mail", placeholder_contains="email@dominio.com")
        el.clear()
        el.send_keys(user_data.get("email", ""))

        # 6) Celular (envie já mask ou apenas números; o componente aplicará máscara)
        el = _find_input_by_label_or_placeholder(driver, label_contains="Celular", placeholder_contains="(00) 00000-0000")
        el.clear()
        phone_val = user_data.get("phone", "")
        # se vier só números, tenta transformar em formato (11) 91111-1111 para convencer o front, mas não é obrigatório
        el.send_keys(phone_val)

        # 7) Endereço (opcional, só para Tutor)
        if desired_type != "Veterinário" and "address" in user_data:
            el = _find_input_by_label_or_placeholder(driver, label_contains="Endereço", placeholder_contains="Rua, CEP e cidade")
            el.clear()
            el.send_keys(user_data.get("address", ""))

        # 8) Senha
        pwd = user_data.get("password", "")
        password_input = _find_input_by_label_or_placeholder(driver, label_contains="Senha", placeholder_contains="8 a 12 caracteres")
        password_input.clear()
        password_input.send_keys(pwd)

        # 9) Submeter formulário
        _click_submit_button(driver)

        # aguardar breve para que submissão ocorra e mensagem de sucesso apareça
        time.sleep(wait_after_submit)
        success = _wait_for_success_message(driver, timeout=5)
        if success:
            return {"ok": True, "message": success, "screenshot": None}

        # se não apareceu sucesso, tentar capturar possíveis mensagem de erro geral
        try:
            err = driver.find_element(By.XPATH, "//div[contains(@style,'background') and contains(.,'Falha') or contains(.,'Erro') or contains(.,'Falha ao salvar')]")
            text = err.text or "Erro desconhecido"
            return {"ok": False, "message": text, "screenshot": capture_screenshot(driver, "./errors/form_error.png")}
        except Exception:
            # fallback genérico
            return {"ok": False, "message": "Nenhuma mensagem de sucesso detectada", "screenshot": capture_screenshot(driver, "./errors/form_error.png")}
    except Exception as e:
        path = capture_screenshot(driver, "form_exception.png")
        return {"ok": False, "message": f"Exceção: {e}", "screenshot": path}
