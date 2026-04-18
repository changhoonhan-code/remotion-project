import cv2
import numpy as np
img = cv2.imread(r'd:\remotion_project\tmp\review_capture.png')
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
mask = cv2.inRange(hsv, np.array([12, 100, 150]), np.array([25, 255, 255]))
contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
c=sorted(contours, key=cv2.contourArea, reverse=True)[0]
x,y,w,h=cv2.boundingRect(c)
cx,cy=x+w//2, y+h//2
b,g,r=img[cy, cx]
print(f'Center Color: #{r:02X}{g:02X}{b:02X}')
print(f'Star width: {w}, height: {h}')
