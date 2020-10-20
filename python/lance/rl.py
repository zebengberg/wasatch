"""An RL agent based on tf tutorial:
https://www.tensorflow.org/agents/tutorials/2_environments_tutorial"""

import numpy as np
import tensorflow as tf

from tf_agents.environments import py_environment
from tf_agents.environments import utils
from tf_agents.specs import array_spec
from tf_agents.trajectories import time_step as ts


GAME_DIMENSION = 10


def rand_tuple():
  return np.random.randint(GAME_DIMENSION), np.random.randint(GAME_DIMENSION)


class LanceEnvironment(py_environment.PyEnvironment):
  """Game environment derived from PyEnvironment."""

  def __init__(self):

    # four possible moves
    self._action_spec = array_spec.BoundedArraySpec(
        shape=(), dtype=np.int32, minimum=0, maximum=3, name='action')

    # 3 arrays representing player position, food position, portal positions
    self._observation_spec = array_spec.BoundedArraySpec(
        shape=(3, GAME_DIMENSION, GAME_DIMENSION), dtype=np.int32, minimum=0,
        maximum=1, name='observation')

    # initial state; filling with some empty values to keep linter happy
    self.player = self.player = GAME_DIMENSION // 2, GAME_DIMENSION // 2
    self.food = 0, 0
    self.portal1 = 0, 0
    self.portal2 = 0, 0
    self.new_food_and_portals()

    self.score = 0
    self._episode_ended = False

  def new_food_and_portals(self):
    self.food = rand_tuple()
    self.portal1 = rand_tuple()
    while self.portal1 == self.food:
      self.portal1 = rand_tuple()
    self.portal2 = rand_tuple()
    while self.portal2 in [self.food, self.portal1]:
      self.portal2 = rand_tuple()

  @property
  def _state(self):
    state = np.zeros((3, GAME_DIMENSION, GAME_DIMENSION), dtype=np.int32)
    state[0, self.player[0], self.player[1]] = 1
    state[1, self.food[0], self.food[1]] = 1
    state[2, self.portal1[0], self.portal1[1]] = 1
    state[2, self.portal2[0], self.portal2[1]] = 1
    return state

  def action_spec(self):
    return self._action_spec

  def observation_spec(self):
    return self._observation_spec

  def _reset(self):
    self.player = self.player = GAME_DIMENSION // 2, GAME_DIMENSION // 2
    self.new_food_and_portals()
    self.score = 0
    self._episode_ended = False
    return ts.restart(self._state)

  def _step(self, action):
    if self._episode_ended:
      self._reset()

    if not self.move_through_portal():
      if action == 0:  # go north
        self.player = self.player[0], self.player[1] + 1
      elif action == 1:  # east
        self.player = self.player[0] + 1, self.player[1]
      elif action == 2:  # south
        self.player = self.player[0], self.player[1] - 1
      elif action == 3:
        self.player = self.player[0] - 1, self.player[1]
      else:
        raise ValueError('`action` should be 0, 1, 2, or 3.')

    self.collide_with_wall()
    self.eat_food()

    if self._episode_ended:
      reward = self.score
      return ts.termination(self._state, reward)
    return ts.transition(self._state, reward=0.0, discount=1.0)

  def collide_with_wall(self):
    if (self.player[0] < 0 or self.player[0] >= GAME_DIMENSION or
            self.player[1] < 0 or self.player[1] >= GAME_DIMENSION):
      self._episode_ended = True

  def eat_food(self):
    if self.player == self.food:
      self.score += 1
      self.new_food_and_portals()

  def move_through_portal(self):
    if self.player == self.portal1:
      self.player = self.portal2
      return True
    elif self.player == self.portal2:
      self.player = self.portal1
      return True
    return False


def test_environment():
  environment = LanceEnvironment()
  utils.validate_py_environment(environment, episodes=5)


test_environment()
