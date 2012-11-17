#!/usr/bin/python

import argparse
import codecs
import sys

import jinja2

from pygments import highlight
from pygments.lexers import guess_lexer_for_filename
from pygments.formatters import HtmlFormatter
from pygments.styles import get_all_styles


help_string = """Process a jinja2 template with no context except for
{{ pygments_css }}. It also adds the 'code' filter, which takes a filename
and gives back the contents of the files with syntax highlighting."""


STYLE_NAME = 'tango'


def render(name, outfile, *args, **kwargs):
    env = jinja2.Environment(loader=jinja2.FileSystemLoader('.'))
    env.filters['code'] = code

    kwargs['pygments_css'] = HtmlFormatter(style=STYLE_NAME).get_style_defs()

    t = env.get_template(name)
    with codecs.open(outfile, 'w', 'UTF-8') as f:
        f.write(t.render(*args, **kwargs))


def code(filename):
    with codecs.open(filename, 'r', 'UTF-8') as f:
        t = f.read()
        return highlight(t, guess_lexer_for_filename(filename, t),
                         HtmlFormatter(style=STYLE_NAME))


def make_arg_parser():
    parser = argparse.ArgumentParser(description=help_string)
    parser.add_argument('template_path', type=str,
                       help="path to the input template")
    parser.add_argument('-o', '--out', type=str, default='index.html',
                       help="path to output template")
    parser.add_argument('-s', '--style', choices=list(get_all_styles()),
                       default='default')
    return parser


if __name__ == '__main__':
    parser = make_arg_parser()
    args = parser.parse_args()
    STYLE_NAME = args.style
    render(args.template_path, args.out)
