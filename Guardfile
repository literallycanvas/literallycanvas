#!/usr/bin/env python
from livereload.task import Task
from livereload.compiler import shell

Task.add('src/*.coffee', shell('gulp browserify'))
Task.add('src/*/*.coffee', shell('gulp browserify'))
Task.add('scss/*.scss', shell('gulp sass'))
Task.add('demo/*.html', shell('true'))
