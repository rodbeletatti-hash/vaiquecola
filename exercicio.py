arr = [3,0,0,-2,0,2,0,-2]
tamanho_janela = arr[0]
lista_de_numeros = arr[1:]
resultados = []
for i in range(len(lista_de_numeros)):
    if i < tamanho_janela:
        janela = sorted(lista_de_numeros[:i+1])
    else:
        janela = sorted(lista_de_numeros[i-tamanho_janela+1:i+1])

    meio = len(janela) // 2
    if len(janela) % 2 == 0:
        resultado = (janela[meio-1] + janela[meio]) // 2
    else:
        resultado = janela[meio]
    resultados.append(resultado)
print(resultados)