"""An tf environment based on tutorial:
https://www.tensorflow.org/agents/tutorials/2_environments_tutorial"""


import os
from tqdm import tqdm
import numpy as np
import tensorflow as tf
from tf_agents.trajectories import time_step as ts
from tf_agents.specs import array_spec
from tf_agents.environments import utils
from tf_agents.environments import tf_py_environment
from tf_agents.environments import py_environment

# disabling tf warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '1'


GAME_DIMENSION = 50


class LanceEnvironment(py_environment.PyEnvironment):
  """Game environment derived from PyEnvironment."""

  def __init__(self):
    super().__init__()

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

  @classmethod
  def rand_tuple(cls):
    """Return a random tuple representing a position in the game."""
    return np.random.randint(GAME_DIMENSION), np.random.randint(GAME_DIMENSION)

  def new_food_and_portals(self):
    """Reset food and portals with random distinct game positions."""
    self.food = self.rand_tuple()
    self.portal1 = self.rand_tuple()
    while self.portal1 == self.food:
      self.portal1 = self.rand_tuple()
    self.portal2 = self.rand_tuple()
    while self.portal2 in [self.food, self.portal1]:
      self.portal2 = self.rand_tuple()

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
    self.move_through_portal()

    if self._episode_ended:
      reward = self.score
      return ts.termination(self._state, reward)
    return ts.transition(self._state, reward=0.0, discount=1.0)

  def collide_with_wall(self):
    """Determine if player collides with wall then reset position to stay in array."""
    if self.player[0] < 0:
      self.player = 0, self.player[1]
      self._episode_ended = True
    elif self.player[0] >= GAME_DIMENSION:
      self.player = GAME_DIMENSION - 1, self.player[1]
      self._episode_ended = True
    elif self.player[1] < 0:
      self.player = self.player[0], 0
      self._episode_ended = True
    elif self.player[1] >= GAME_DIMENSION:
      self.player = self.player[0], GAME_DIMENSION - 1
      self._episode_ended = True

  def eat_food(self):
    """Eat then reset food and portals if player is touching food."""
    if self.player == self.food:
      self.score += 1
      self.new_food_and_portals()

  def move_through_portal(self):
    """If player is touching portal door, move through portal."""
    if self.player == self.portal1:
      self.player = self.portal2
    elif self.player == self.portal2:
      self.player = self.portal1


def test_environment():
  """Test environment using built-in validate tool."""
  environment = LanceEnvironment()
  utils.validate_py_environment(environment, episodes=5)
  print('Test successful.')


def test_episodes(num_episodes=10):
  """Test environment with random actions."""
  env = LanceEnvironment()
  tf_env = tf_py_environment.TFPyEnvironment(env)
  time_step = tf_env.reset()
  rewards = []
  steps = []

  for _ in tqdm(range(num_episodes)):
    episode_reward = 0
    episode_steps = 0
    while not time_step.is_last():
      action = tf.random.uniform([1], 0, 4, tf.int32)
      time_step = tf_env.step(action)
      episode_steps += 1
      episode_reward += time_step.reward.numpy()
    rewards.append(episode_reward)
    steps.append(episode_steps)
    time_step = tf_env.reset()

  num_steps = np.sum(steps)
  avg_length = np.mean(steps)
  avg_reward = np.mean(rewards)
  print('num_episodes:', num_episodes, 'num_steps:', num_steps)
  print('avg_length', avg_length, 'avg_reward:', avg_reward)


if __name__ == '__main__':
  test_environment()
  test_episodes()
