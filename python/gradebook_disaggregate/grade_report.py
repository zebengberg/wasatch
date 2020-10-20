import csv
import sys
import re
import datetime as dt


def get_meta_data(header):
  """Get meta-data as dictionary for assignment-type headers."""
  match = re.search(r'Max Pts: \d+,', header)
  if match is None:
    return None

  try:
    points = int(match.group()[9:-1])
    match = re.search(r'Due Date: \d+/\d+/\d+', header)
    date = dt.datetime.strptime(match.group()[10:], '%m/%d/%y').date()
    match = re.search(r'Grading Category: \w', header)
    category = match.group()[18]
    return {'points': points, 'date': date, 'category': category}
  except AttributeError:
    if header not in bad_assignments:
      bad_assignments.append(header)
      i = header.find('(')
      print('Something is wrong with meta-data for assignment: ' + header[:i - 1])
      print('Perhaps due-date is missing?!')


def analyze_student(student_row):
  """Get student grades for Q3 and Q4."""
  global headers # pylint: disable=global-statement

  first = student_row['First Name']
  match = re.search(r'\((.*?)\)', first)
  if match:
    first = match.group()[1: -1]
  last = student_row['Last Name']

  student_scores = {'F3': 0, 'S3': 0, 'F4': 0, 'S4': 0}
  total_points = {'F3': 0, 'S3': 0, 'F4': 0, 'S4': 0}

  for header in headers:
    meta = get_meta_data(header)
    if meta and meta['category'] in ['F', 'S'] and meta['date'] > dt.date(2020, 1, 1):
      key = meta['category']
      if meta['date'] < dt.date(2020, 3, 15):
        key += '3'
      else:
        key += '4'

      score = student_row[header]
      try:
        student_scores[key] += int(score)
        total_points[key] += meta['points']
      except ValueError:  # student Except or no grade entered
        pass

  try:
    q3 = (0.4 * student_scores['F3'] / total_points['F3'] + \
        0.6 * student_scores['S3'] / total_points['S3']) * 100
    q4 = (0.4 * student_scores['F4'] / total_points['F4'] + \
        0.6 * student_scores['S4'] / total_points['S4']) * 100
  except ZeroDivisionError:
    print('Not have enough assignments in schoology for {}!'.format(first))
    return

  print('{:10.10} {:10.10}    Q3: {:6.2f}    Q4: {:6.2f}'.format(first, last, q3, q4))


# Opening the csv and printing the results.
file_name = sys.argv[-1]
bad_assignments = []
with open(file_name) as f:
  reader = csv.DictReader(f)
  headers = reader.fieldnames
  print('-' * 80)
  for student in reader:
    analyze_student(student)
  print('-' * 80)
