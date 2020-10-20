import pygame
from random import randint
pygame.init()


CELL_SIZE = 20
DIMENSION = 30
screen = pygame.display.set_mode([DIMENSION * CELL_SIZE, DIMENSION * CELL_SIZE])
pygame.display.set_caption('Hello World')


clock = pygame.time.Clock()



class Player:
    def __init__(self):
        self.x = DIMENSION // 2
        self.y = DIMENSION // 2
        self.dx = 1
        self.dy = 0
        self.color = (255,0,0)
        self.score = 0
        
    def apply_key(self, key):
        if key == pygame.K_LEFT:
            self.dx = -1
            self.dy = 0
        elif key == pygame.K_UP:
            self.dx = 0
            self.dy = -1
        elif key == pygame.K_RIGHT:
            self.dx = 1
            self.dy = 0
        elif key == pygame.K_DOWN:
            self.dx = 0
            self.dy = 1
            
    def move(self):
        self.x += self.dx
        self.y += self.dy
        
    def collision(self):
        if (self.x < 0 or self.x >= DIMENSION or self.y < 0 or self.y >= DIMENSION):
            self.__init__()
        
    def eat(self, food):
        if self.x == food.x and self.y == food.y:
            self.score += 1
            food.__init__()

    
    def draw(self):
        pygame.draw.rect(screen, self.color, (self.x * CELL_SIZE, self.y * CELL_SIZE, CELL_SIZE, CELL_SIZE))

class Food:
    def __init__(self):
        self.x = randint(0, DIMENSION - 1)
        self.y = randint(0, DIMENSION - 1)
        self.color = (0,255,0)
        
    def draw(self):
        pygame.draw.rect(screen, self.color, (self.x * CELL_SIZE, self.y * CELL_SIZE, CELL_SIZE, CELL_SIZE))
        
class Portal:
    def __init__(self):
        self.x1 = randint(0,0, DIMENSION - 1)
        self.y1 = randint(0,0, DIMENSION - 1)
        self.x2 = randint(0,0, DIMENSION - 1)
        self.y2 = randint(0,0, DIMENSION - 1)

        
p = Player()

f = Food()
  

running = True
while running:
    clock.tick(5)
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        elif event.type == pygame.KEYDOWN:
            print(event.key)
            p.apply_key(event.key)
            
    screen.fill((255, 255, 255))
    p.move()
    p.collision()
    p.eat(f)
    p.draw()
    f.draw()
    # updates pygame display
    pygame.display.flip()

pygame.quit()