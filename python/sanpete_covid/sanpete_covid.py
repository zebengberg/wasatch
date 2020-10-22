"""Plot Sanpete COVID cases over time from CUPH data."""

import os
import requests
import datetime as dt
from lxml import html
import tabula
import pandas as pd
import matplotlib.pyplot as plt


def is_pdf_current():
  """Check if locally saved PDF is more than 1 hour old."""
  if os.path.exists('data.pdf'):
    t = os.path.getmtime('data.pdf')
    t = dt.datetime.fromtimestamp(t)
    return t > dt.datetime.now() - dt.timedelta(hours=1)
  return False


def scrape_pdf_and_save():
  """Scrape COVID data from CUPH website."""
  print('Requesting PDF from CUPH website...')
  cuph_url = 'https://centralutahpublichealth.org/'
  r = requests.get(cuph_url)
  tree = html.fromstring(r.content)
  button = tree.xpath('//div[text()="DETAILED INFO"]')
  button = button[0]  # button is a list
  anchor = button.getparent().getparent()
  pdf_url = anchor.get('href')

  r = requests.get(pdf_url)
  with open('data.pdf', 'wb') as f:
    f.write(r.content)


def pdf_to_dates(file):
  """Use tabula to parse file-like PDF to a list of dates."""
  print('Parsing with tabula ...')
  dfs = tabula.read_pdf(file, pages='all', options="--columns 100,200",
                        guess=False, pandas_options={'header': None},)
  dates = []
  for df in dfs:
    s = df[df[0] == 'SANPETE'][1]
    if len(s):
      dates += s.tolist()
  return dates


def load_data():
  """Check and load COVID data from file."""
  if not is_pdf_current():
    scrape_pdf_and_save()

  with open('data.pdf', 'rb') as f:
    return pdf_to_dates(f)


def parse_text(text):
  """Parse text for dates of reported Sanpete COVID cases."""
  text = text.split('SANPETE')
  text = text[1:]  # removing footer
  dates = [item[2:12] for item in text]
  dates = [date.split('/') for date in dates]

  def parse_date_list(date):
    if len(date) != 3:
      return None
    if len(date[0]) == 1:
      date[0] = '0' + date[0]
    if len(date[1]) == 1:
      date[1] = '0' + date[1]
    if len(date[2]) > 4:
      date[2] = date[2][:4]
    return date

  dates = [parse_date_list(date) for date in dates]
  dates = ['/'.join(date) for date in dates if date]
  return dates


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
