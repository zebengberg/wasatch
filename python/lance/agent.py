"""A tf agent based on: https://www.tensorflow.org/agents/tutorials/1_dqn_tutorial"""

import tensorflow as tf
from environment import LanceEnvironment
from tf_agents.utils import common
from tf_agents.metrics import tf_metrics
from tf_agents.replay_buffers import tf_uniform_replay_buffer
from tf_agents.environments import tf_py_environment
from tf_agents.networks import q_network
from tf_agents.drivers import dynamic_step_driver
from tf_agents.agents.dqn import dqn_agent

# suppress warnings
tf.get_logger().setLevel('ERROR')


CHECKPOINT_DIR = 'saved_checkpoints'


# hyperparameters
collect_steps_per_iteration = 100
replay_buffer_capacity = 30
fc_layer_params = (100,)
batch_size = 1
learning_rate = 1e-3
log_interval = 1


# environment
train_py_env = LanceEnvironment()
eval_py_env = LanceEnvironment()
train_env = tf_py_environment.TFPyEnvironment(train_py_env)
eval_env = tf_py_environment.TFPyEnvironment(eval_py_env)


# agent
q_net = q_network.QNetwork(
    train_env.observation_spec(),
    train_env.action_spec(),
    fc_layer_params=fc_layer_params)
optimizer = tf.keras.optimizers.Adam(learning_rate=learning_rate)
global_step = tf.Variable(1, name='global_step')
agent = dqn_agent.DqnAgent(
    train_env.time_step_spec(),
    train_env.action_spec(),
    q_network=q_net,
    optimizer=optimizer,
    td_errors_loss_fn=common.element_wise_squared_loss,
    train_step_counter=global_step)
agent.initialize()


# data collection
replay_buffer = tf_uniform_replay_buffer.TFUniformReplayBuffer(
    data_spec=agent.collect_data_spec,
    batch_size=train_env.batch_size,
    max_length=replay_buffer_capacity)
print(replay_buffer.data_spec)
metric = tf_metrics.AverageReturnMetric()
driver = dynamic_step_driver.DynamicStepDriver(
    train_env,
    agent.collect_policy,
    observers=[replay_buffer.add_batch, metric],
    num_steps=collect_steps_per_iteration)
# Initial data collection
driver.run()
# Dataset generates trajectories with shape [BxTx...] where
# T = n_step_update + 1.
dataset = replay_buffer.as_dataset(
    num_parallel_calls=3, sample_batch_size=batch_size,
    num_steps=2, single_deterministic_pass=False).prefetch(3)
iterator = iter(dataset)

train_checkpointer = common.Checkpointer(ckpt_dir=CHECKPOINT_DIR, max_to_keep=1,
                                         agent=agent, policy=agent.policy,
                                         replay_buffer=replay_buffer,
                                         global_step=global_step)


# train the agent
# (Optional) Optimize by wrapping some of the code in a graph using TF function.
agent.train = common.function(agent.train)


def train_one_iteration():
  # Collect a few steps using collect_policy and save to the replay buffer.
  driver.run()

  # Sample a batch of data from the buffer and update the agent's network.
  experience, unused_info = next(iterator)
  # print('#' * 80)
  print_walk(experience)
  print(experience.is_boundary().numpy())
  print(experience.is_first().numpy())
  print(experience.is_mid().numpy())
  print(experience.is_last().numpy())
  loss = agent.train(experience).loss
  step = agent.train_step_counter.numpy()

  if step % log_interval == 1:
    print(f'step: {step} loss: {loss}')
    print(metric.result().numpy())
    print_status(experience)


def print_walk(e):
  # first and second observations of the player
  player1 = e.observation.numpy()[0][0][0]
  player2 = e.observation.numpy()[0][1][0]
  food1 = 2 * e.observation.numpy()[0][0][1]
  portal1 = 4 * e.observation.numpy()[0][0][2]
  #print(player1 + food1 + portal1)
  print(player1)
  print(player2)


def print_status(e):
  print(e.reward.numpy())


def run():
  for _ in range(2):
    train_one_iteration()


def save_checkpoint():
  """Save tf checkpoint to file."""
  train_checkpointer.save(global_step)


def load_policy():
  """Load tf checkpoint from file."""
  train_checkpointer.initialize_or_restore()
  # fix global step to not use compat.v1
  # global_step = tf.compat.v1.train.get_global_step()


if __name__ == '__main__':
  run()
