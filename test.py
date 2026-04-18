import cv2
import numpy as np
img = cv2.imread(r'd:\remotion_project\tmp\review_capture.png')
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
mask = cv2.inRange(hsv, np.array([12, 100, 200]), np.array([25, 255, 255]))
y,x = np.where(mask > 0)
print('Points:', len(y))
if len(y)>0:
    b,g,r=img[y[0], x[0]]
    print(f'Color: #{r:02X}{g:02X}{b:02X}')
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if contours:
        c=sorted(contours, key=cv2.contourArea, reverse=True)[0]
        x,y,w,h=cv2.boundingRect(c)
        print(f'Star width: {w}, height: {h}')
