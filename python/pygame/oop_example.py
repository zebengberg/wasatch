# run with pythonw on mac

import random
import pygame
pygame.init()

screen = pygame.display.set_mode([400, 400])
pygame.display.set_caption('Hello World')


class Snake:
  def __init__(self):
    self.x = screen.get_width() // 2
    self.y = screen.get_height() // 2
    self.r = 10
    self.direction = 'RIGHT'
    self.color = (0, 0, 255)
    self.food_position = (random.randint(10, screen.get_width() - 10),
                          random.randint(10, screen.get_width() - 10))
    self.food_color = (255, 127, 0)

  def update_position(self):
    if self.direction == 'RIGHT':
      self.x += 1
    elif self.direction == 'LEFT':
      self.x -= 1
    elif self.direction == 'UP':
      self.y -= 1
    elif self.direction == 'DOWN':
      self.y += 1

  def draw(self):
    pygame.draw.circle(screen, self.food_color, self.food_position, 10)
    pygame.draw.circle(screen, self.color, (self.x, self.y), self.r)

  def update_direction(self, key):
    key_codes = {pygame.K_UP: 'UP',
                 pygame.K_DOWN: 'DOWN',
                 pygame.K_RIGHT: 'RIGHT',
                 pygame.K_LEFT: 'LEFT'}
    if key in key_codes:
      target_direction = key_codes[key]
      direction_set = {target_direction, self.direction}
      valid_directions = [{'UP', 'RIGHT'},
                          {'UP', 'LEFT'},
                          {'DOWN', 'RIGHT'},
                          {'DOWN', 'LEFT'}]
      if direction_set in valid_directions:
        self.direction = target_direction

  def hit_wall(self):
    w, h = screen.get_width(), screen.get_height()
    if (self.x - self.r < 0 or self.x + self.r > w or
            self.y - self.r < 0 or self.y + self.r > h):
      self.direction = None

  def is_near_food(self):
    x = self.x - self.food_position[0]
    y = self.y - self.food_position[1]
    return x ** 2 + y ** 2 <= (self.r + 20) ** 2

  def eat(self):
    self.food_position = (random.randint(10, screen.get_width() - 10),
                          random.randint(10, screen.get_width() - 10))
    self.r += 2


s = Snake()

running = True
while running:
  for event in pygame.event.get():
    if event.type == pygame.QUIT:
      running = False
    elif event.type == pygame.KEYDOWN:
      # update the direction
      s.update_direction(event.key)
      # restart the game
      if event.key == pygame.K_r:
        s.__init__()

  screen.fill((255, 255, 255))
  s.update_position()
  s.hit_wall()
  if s.is_near_food():
    s.eat()
  s.draw()

  # updates pygame display
  pygame.display.flip()

pygame.quit()
