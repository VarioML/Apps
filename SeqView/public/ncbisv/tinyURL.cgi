#!/usr/bin/env python
import urllib, urllib2, sys, os
base_url = 'http://www.ncbi.nlm.nih.gov/projects/sviewer/'
cgi_name = base_url + sys.argv[0].split('/')[-1]
cookies = os.environ.get("HTTP_COOKIE", "")
query_string = os.environ.get("QUERY_STRING", "")
if len(query_string) > 0:
    cgi_name += "?" + query_string
req = urllib2.Request(cgi_name)
if len(cookies) > 0:
    req.add_header("Cookie", cookies)
data = sys.stdin.read();
response = urllib2.urlopen(req,data)
info = response.info()
del info['Transfer-Encoding']
print info
print response.read()

