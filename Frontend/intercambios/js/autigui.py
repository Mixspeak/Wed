import pyautogui
import time

try:
    while True:
        pyautogui.moveRel(1, 0)
        time.sleep(2)
        pyautogui.moveRel(-1, 0)
        pyautogui.write("for i, headerName := range rateLimitingConfig.RateLimiting.Strategy.Config.HeaderNames {\n", interval=0.05)
        time.sleep(30)
        pyautogui.write("headerValue := req.Header.Get(headerName)\n", interval=0.05)
except KeyboardInterrupt:
    print("Detenido por el usuario")
