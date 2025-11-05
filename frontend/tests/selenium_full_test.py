from selenium import webdriver
import time
from user_form_test import fill_and_submit_user_form

navegador = webdriver.Chrome()
navegador.get("http://localhost:5173/register")
navegador.maximize_window()

tutor = {
        "type": "Tutor",
        "name": "João das Neves",
        "cpf": "123.456.789-00",
        "email": "joao@example.com",
        "phone": "(11) 98888-7777",
        "password": "senha1234",
        "address": "Rua A, 00000-000"
    }
res = fill_and_submit_user_form(navegador, tutor, mode="create")
print(res)

    # exemplo Veterinário:
vet = {
        "type": "Veterinário",
        "name": "Dra. Maria Silva",
        "cpf": "987.654.321-00",
        "email": "maria@vet.com",
        "phone": "(21) 97777-6666",
        "password": "vetpass12",
        "crmv": "CRMV-RJ 54321",
        "clinicAddress": "Av. Vet, 123 - RJ",
        "professionalIdDoc": "./examples/exemplo.pdf",
        "diplomaDoc": "./examples/exemplo.pdf"
    }
    # navegar para a mesma página (o componente permite selecionar tipo) ou recarregar
navegador.refresh()
time.sleep(1)
res2 = fill_and_submit_user_form(navegador, vet, mode="create")
print(res2)

time.sleep(10)