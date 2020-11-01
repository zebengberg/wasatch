"""A module for converting .docx meal schedules to json."""


import glob
import json
import docx


def cell_to_list(unstructured_cell):
  """Clean up a text and return a list of nonempty items."""
  items = unstructured_cell.split('\n')
  items = [item.strip() for item in items if item]
  if 'BRUNCH' in items:
    items.remove('BRUNCH')
  return items


def parse_docx(filepath):
  """Parse a docx and return nested dictionary of meal items."""

  doc = docx.Document(filepath)
  table = doc.tables[0]
  weekdays = [cell.text for cell in table.rows[0].cells]
  weekdays = [day.upper() for day in weekdays]
  meal_names = [cell.text for cell in table.columns[0].cells]

  data = {}
  for weekday, column in zip(weekdays, table.columns):
    if weekday:
      data[weekday] = {meal: cell_to_list(cell.text)
                       for meal, cell in zip(meal_names, column.cells) if meal}
  return data


def build_json():
  """Build json data for meals."""
  doc_files = glob.glob('word_docs/*.docx')
  data = {}
  for f in doc_files:
    week_name = f[10:15]
    # some issue with week3 docx formatting
    # also note that week4 docx has two tables
    # avoid dealing with these for now
    if week_name not in ['week3', 'week4']:
      data[week_name.upper()] = parse_docx(f)

  with open('meals.json', 'w') as f:
    json.dump(data, f, indent=2)


if __name__ == '__main__':
  build_json()
