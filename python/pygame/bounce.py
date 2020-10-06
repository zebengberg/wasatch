# run with pythonw on mac

import random
import math
import pygame
pygame.init()

screen = pygame.display.set_mode([400, 400])
pygame.display.set_caption('Hello World')


class Ball:
  def __init__(self, x, y, dx, dy):
    self.x = x
    self.y = y
    self.r = 10
    self.dx = dx
    self.dy = dy
    self.n_steps = 0
    self.color = (0, 0, 255)

  def update_position(self):
    self.x += self.dx
    self.y += self.dy
    self.n_steps += 1

  def draw(self):
    pygame.draw.circle(screen, self.color, (int(self.x), int(self.y)), self.r)

  def hit_wall(self):
    w, h = screen.get_width(), screen.get_height()
    if self.x - self.r < 0 or self.x + self.r > w:
      self.dx *= -1
    if self.y - self.r < 0 or self.y + self.r > h:
      self.dy *= -1


class Cannon:
  def __init__(self):
    self.theta = 0
    self.tip = None
    self.color = (0, 255, 0)
    self.balls = []

  def draw(self):
    x = screen.get_width() // 2
    y = screen.get_height() - 5
    dy = 80
    dx = 10

    p1 = int(x + math.cos(self.theta) * dx /
             2), int(y + math.sin(self.theta) * dx / 2)
    p2 = int(p1[0] + math.sin(self.theta) *
             dy), int(p1[1] - math.cos(self.theta) * dy)
    p3 = int(p2[0] - math.cos(self.theta) *
             dx), int(p2[1] - math.sin(self.theta) * dx)
    p4 = int(p3[0] - math.sin(self.theta) *
             dy), int(p3[1] + math.cos(self.theta) * dy)

    self.tip = x + math.sin(self.theta) * dy, y - math.cos(self.theta) * dy

    pygame.draw.polygon(screen, self.color, [p1, p2, p3, p4])
    for b in self.balls:
      b.draw()

  def update(self, key):
    if key == pygame.K_LEFT:
      self.theta -= 0.05
    elif key == pygame.K_RIGHT:
      self.theta += 0.05

  def shoot(self, key):
    if key == pygame.K_SPACE:
      dx = 2 * math.sin(self.theta)
      dy = -2 * math.cos(self.theta)
      self.balls.append(Ball(self.tip[0], self.tip[1], dx, dy))


c = Cannon()

running = True
while running:
  for event in pygame.event.get():
    if event.type == pygame.QUIT:
      running = False
    elif event.type == pygame.KEYDOWN:
      c.update(event.key)
      c.shoot(event.key)

  screen.fill((255, 255, 255))
  c.draw()

  for i, b in enumerate(c.balls):
    b.hit_wall()
    b.update_position()
    if b.n_steps > 500:
      del c.balls[i]

  # updates pygame display
  pygame.display.flip()

pygame.quit()
