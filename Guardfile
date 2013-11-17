#!/usr/bin/env python
from livereload.task import Task
from livereload.compiler import shell

Task.add('coffee/*.coffee', shell('make clean all'))
Task.add('coffee/*/*.coffee', shell('make clean all'))
Task.add('scss/*.scss', shell('make scss'))
Task.add('demo/*.html', shell('make clean all'))
