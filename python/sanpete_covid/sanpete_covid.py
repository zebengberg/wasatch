"""Plot Sanpete COVID cases over time from CUPH data."""

import os
import glob
import requests
import datetime as dt
from lxml import html
import tabula
import pandas as pd
import matplotlib.pyplot as plt


def get_local_data():
  """Return a local data path, or None if it doesn't exist."""
  local_data = glob.glob('cuph_data*')
  # should be at most one file
  if local_data:
    return local_data[0]
  return None


def is_local_data_current():
  """Check if locally saved data is more than 1 hour old."""
  data = get_local_data()
  if data:
    t = os.path.getmtime(data)
    t = dt.datetime.fromtimestamp(t)
    return t > dt.datetime.now() - dt.timedelta(hours=1)
  return False


def scrape_data_and_save():
  """Scrape COVID data from CUPH website."""
  print('Requesting data from CUPH website...')
  cuph_url = 'https://centralutahpublichealth.org/'
  r = requests.get(cuph_url)
  tree = html.fromstring(r.content)
  button = tree.xpath('//div[text()="DETAILED INFO"]')
  button = button[0]  # button is a list
  anchor = button.getparent().getparent()
  data_url = anchor.get('href')

  # determining if data is pdf or excel format
  file_type = data_url.split('.')[-1]
  r = requests.get(data_url)
  with open('cuph_data.' + file_type, 'wb') as f:
    f.write(r.content)


def pdf_to_dates(file):
  """Use tabula to parse PDF file to a list of dates."""
  print('Parsing PDF with tabula ...')
  dfs = tabula.read_pdf(file, pages='all', options="--columns 100,200",
                        guess=False, pandas_options={'header': None},)
  dates = []
  for df in dfs:
    s = df[df[0] == 'SANPETE'][1]
    if len(s):
      dates += s.tolist()
  return dates


def excel_to_dates(file):
  """Use pandas to parse excel file to a list of dates."""
  print('Parsing EXCEL with pandas ...')
  df = pd.read_excel(file, header=1)
  s = df[df['COUNTY'] == 'SANPETE']['DATE OF NOTIFICATION']
  return s.to_list()


def load_data():
  """Check and load COVID data from file."""
  if not is_local_data_current():
    # removing anything stored locally
    data_path = get_local_data()
    if data_path:
      os.remove(data_path)
    scrape_data_and_save()

  # keeping pyright happy by casting to string
  data_path = get_local_data()
  if data_path is None:
    raise FileNotFoundError('Something wrong! Scraped data not found locally.')
  else:
    file_type = data_path.split('.')[-1]
    with open(data_path, 'rb') as f:
      if file_type == 'pdf':
        return pdf_to_dates(f)
      elif file_type == 'xlsx':
        return excel_to_dates(f)
      else:
        raise NotImplementedError('Unknown file type of data.')


def make_histogram(dates, save=True, recent_only=False):
  """Cast to pd.Series and plot histogram."""
  name = 'sanpete'
  s = pd.Series(dates)
  s = pd.to_datetime(s)
  s = s.groupby(s).count()
  s = s.resample('1D').asfreq().fillna(0)
  if recent_only:
    cutoff = pd.to_datetime(dt.datetime.now() - dt.timedelta(days=50))
    s = s[s.index > cutoff]
    name += '_recent'

  r = s.rolling('7D').mean()

  fig, ax = plt.subplots(figsize=(12, 6))
  ax.bar(s.index, s)
  ax.plot(r, 'r', linewidth=4)
  plt.xticks(rotation=60)
  plt.title('Sanpete COVID cases')
  ax.legend(['7 day rolling average', 'case counts'])
  fig.tight_layout()
  if save:
    plt.savefig(name + '.png')
  plt.show(block=True)


if __name__ == '__main__':
  dates_list = load_data()
  print('Total number of cases:', len(dates_list))
  make_histogram(dates_list, recent_only=False)
  make_histogram(dates_list, recent_only=True)
