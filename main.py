# main.py
import ast
import concurrent.futures
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import types
from tracker import TrackedArray
import algos
import ast
import concurrent.futures

app = FastAPI()

# Настройка CORS, чтобы браузер не блокировал сетевые запросы
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Схемы данных для валидации входящих POST-запросов
class StandardReq(BaseModel):
    algo: str
    arr: list[int]

class CustomReq(BaseModel):
    code: str
    arr: list[int]


# ФУНКЦИЯ ПРОВЕРКИ КОДА НА БЕЗОПАСНОСТЬ
def is_code_safe(code_str: str) -> bool:
    try:
        tree = ast.parse(code_str)
    except SyntaxError:
        return False # Код с синтаксической ошибкой
        
    # Запрещаем любые импорты
    for node in ast.walk(tree):
        if isinstance(node, (ast.Import, ast.ImportFrom)):
            return False

    # Запрещаем вызовы потенциально опасных встроенных функций
    forbidden_calls = {'eval', 'exec', 'open', '__import__', 'compile', 'globals', 'locals', 'getattr', 'setattr', 'delattr'}
    for node in ast.walk(tree):
        if isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name) and node.func.id in forbidden_calls:
                return False
    return True

@app.post("/api/sort/custom")
def run_custom_sort(req: CustomReq):
    if not req.arr:
        return {"frames": [], "metadata": {"size": 0, "initial_array": []}}
        
    # 1. Проверка синтаксиса и безопасности (AST)
    if not is_code_safe(req.code):
        raise HTTPException(status_code=400, detail="Код содержит запрещенные операции (импорты, чтение файлов и т.д.)")
        
    # 2. Ограничение встроенных функций (Sandboxing)
    safe_builtins = {
        'range': range, 'len': len, 'print': print,
        'int': int, 'float': float, 'bool': bool, 'str': str,
        'min': min, 'max': max, 'abs': abs, 'sum': sum,
        'enumerate': enumerate, 'zip': zip, 'list': list, 'tuple': tuple
    }
    namespace = {'__builtins__': safe_builtins}
    
    try:
        exec(req.code, namespace)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Ошибка компиляции: {str(e)}")
        
    # Ищем функцию пользователя
    user_func = None
    for key, val in namespace.items():
        if not key.startswith('__') and isinstance(val, types.FunctionType):
            user_func = val
            break
            
    if user_func is None:
        raise HTTPException(status_code=400, detail="Не найдена функция для сортировки. Создайте функцию, принимающую массив 'arr'.")
        
    tracked = TrackedArray(req.arr)
    
    # Обертка для запуска в отдельном потоке
    def run_sort():
        user_func(tracked)
        
    # 3. Защита от бесконечных циклов (Таймаут 2 секунды)
    try:
        with concurrent.futures.ThreadPoolExecutor() as executor:
            future = executor.submit(run_sort)
            future.result(timeout=2.0) 
    except concurrent.futures.TimeoutError:
        raise HTTPException(status_code=400, detail="Превышено время выполнения (возможно бесконечный цикл)")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Ошибка выполнения кода: {str(e)}")
        
    return tracked.get_result(req.arr)

@app.post("/api/sort/standard")
def run_standard_sort(req: StandardReq):
    if not req.arr:
        return {"frames": [], "original": []}
        
    tracked = TrackedArray(req.arr)
    
    # Исправленные условия под ключи из sort.json
    if req.algo == "bubble_sort": algos.bubble_sort(tracked)
    elif req.algo == "selection_sort": algos.selection_sort(tracked)
    elif req.algo == "insertion_sort": algos.insertion_sort(tracked)
    elif req.algo == "merge_sort": algos.merge_sort(tracked)
    elif req.algo == "shaker_sort": algos.shaker_sort(tracked)
    elif req.algo == "timsort": algos.timsort(tracked)
    elif req.algo == "comb_sort": algos.comb_sort(tracked)
    elif req.algo == "heap_sort": algos.heap_sort(tracked)
    elif req.algo == "quick_sort": algos.quick_sort(tracked)
    elif req.algo == "stalin_sort": algos.stalin_sort(tracked)
    else: raise HTTPException(status_code=400, detail=f"Указанный алгоритм '{req.algo}' не найден на бэкенде")
        
    # Возвращаем сгенерированные кадры анимации напрямую в формате JSON
    return tracked.get_result(req.arr)


from fastapi.staticfiles import StaticFiles

app.mount("/", StaticFiles(directory="Frontend", html=True), name="Frontend")

'''python -m uvicorn main:app --reload'''
'''Live Server'''
