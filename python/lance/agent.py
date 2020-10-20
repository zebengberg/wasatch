"""A tf agent based on: https://www.tensorflow.org/agents/tutorials/1_dqn_tutorial"""

import tensorflow as tf
from tf_agents.agents.dqn import dqn_agent
from tf_agents.drivers import dynamic_step_driver
from tf_agents.networks import q_network
from tf_agents.environments import tf_py_environment
from tf_agents.replay_buffers import tf_uniform_replay_buffer
from tf_agents.metrics import tf_metrics
from tf_agents.policies import policy_saver
from tf_agents.utils import common
from environment import LanceEnvironment


# hyperparameters
collect_steps_per_iteration = 100
replay_buffer_capacity = 100000
fc_layer_params = (100,)
batch_size = 64
learning_rate = 1e-3
log_interval = 5


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
optimizer = tf.compat.v1.train.AdamOptimizer(learning_rate=learning_rate)
global_step = tf.compat.v1.train.get_or_create_global_step()
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


# train the agent
# (Optional) Optimize by wrapping some of the code in a graph using TF function.
agent.train = common.function(agent.train)


def train_one_iteration():
  # Collect a few steps using collect_policy and save to the replay buffer.
  driver.run()

  # Sample a batch of data from the buffer and update the agent's network.
  experience, unused_info = next(iterator)
  loss = agent.train(experience).loss
  step = agent.train_step_counter.numpy()

  if step % log_interval == 0:
    print(f'step: {step} loss: {loss}')
    print(metric.result().numpy())


for _ in range(2000):
  train_one_iteration()


# policy saver
# tf_policy_saver = policy_saver.PolicySaver(agent.policy)
# tf_policy_saver.save('saved_policies')
