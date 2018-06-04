#!/usr/bin/python
# -*- coding: utf-8 -*-
# surport CVE-2016-1295 and CVE-2014-3389  ASA Version leak
# surport IPSEC ikev1 and v2 detection
# scan result: {'error_info': 'VPN Server internal error.', 'ikev2': 1, 'client': 'vpn', 'version': '8.4(2)', 'error_id': '96', 'ikev1': 1, 'type': 'complete'}
#

import socket
import string
import random
import struct
import urllib2
import ssl
import xml.etree.ElementTree as ET
ssl._create_default_https_context = ssl._create_unverified_context

# saving scan result
info = dict()

# initilize
info['version'] = "null"
info['ikev1'] = 0
info['ikev2'] = 0

# ikev1 scan
class ikev1(object):
    def __init__(self, host, host_port, id=None):
        if id == None:
            id = ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(8))

        self._host =host
        self._port = host_port
        self._sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self._sock.settimeout(1.0)
        self._id = id
        self._mid = 1

        # Init session
        self.send(self.Ikev1_SA())

        # Check if we got something
        self.recv()

    # UPD socket helpers
    def send(self, buf):
        self._sock.sendto(buf, (self._host, self._port))

    def recv(self, size=4096):
        try:
            data, addr = self._sock.recvfrom(size)
            info['ikev1'] = 1
        except socket.timeout:
            pass

    def Ikev1_SA(self):
        buf = ""
        buf += self._id  # Initiator SPI
        buf += "\x00" * 8  # Responder SPI
        buf += "\x01"  # next payload (security association)
        buf += "\x10"  # version
        buf += "\x02"  # exchange type
        buf += "\x00"  # flags
        buf += "\x00" * 4  # message ID
        buf += "$$$$"  # length

        # THIS IS SECURITY ASSOCIATION
        buf +=  "\x0d\x00\x00\x38\x00\x00\x00\x01\x00\x00\x00\x01\x00\x00\x00\x2c" \
                "\x01\x01\x00\x01\x00\x00\x00\x24\x01\x01\x00\x00\x80\x0b\x00\x01" \
                "\x80\x0c\x70\x80\x80\x01\x00\x07\x80\x0e\x01\x00\x80\x03\x00\x01" \
                "\x80\x02\x00\x06\x80\x04\x00\x14"

        # THIS IS KEY EXCHANGE
        # this is the type of the next payload...
        buf += "\x28"  # 0x28 = Nonce, 0x2b = vendor ID
        # KEY EXCHANGE DATA
        buf += "\x00\x00\x88\x00\x02\x00\x00\x50\xea\xf4\x54\x1c\x61\x24\x1b\x59\x3f\x48\xcb\x12\x8c\xf1\x7f\x5f\xd4\xd8\xe9\xe2\xfd\x3c\x66\x70\xef\x08\xf6\x56\xcd\x83\x16\x65\xc1\xdf\x1c\x2b\xb1\xc4\x92\xca\xcb\xd2\x68\x83\x8e\x2f\x12\x94\x12\x48\xec\x78\x4b\x5d\xf3\x57\x87\x36\x1b\xba\x5b\x34\x6e\xec\x7e\x39\xc1\xc2\x2d\xf9\x77\xcc\x19\x39\x25\x64\xeb\xb7\x85\x5b\x16\xfc\x2c\x58\x56\x11\xfe\x49\x71\x32\xe9\xe8\x2d\x27\xbe\x78\x71\x97\x7a\x74\x42\x30\x56\x62\xa2\x99\x9c\x56\x0f\xfe\xd0\xa2\xe6\x8f\x72\x5f\xc3\x87\x4c\x7c\x9b\xa9\x80\xf1\x97\x57\x92"

        # this is the Nonce payload
        buf +=  "\x0d\x00\x00\x14\xaf\xca\xd7\x13\x68\xa1\xf1\xc9\x6b\x86\x96\xfc" \
                "\x77\x57\x01\x00"

        # another vendor id
        buf += "\x2b"  # next payload, more vendor ID
        buf += "\x00"  # critical bit
        vid = "CISCO(COPYRIGHT)&Copyright (c) 2009 Cisco Systems, Inc."
        buf += struct.pack(">H", len(vid) + 4)
        buf += vid

        # another vendor id
        buf += "\x2b"  # next payload, more vid
        buf += "\x00"  # crit
        vid = "CISCO-GRE-MODE"
        buf += struct.pack(">H", len(vid) + 4)
        buf += vid

        # last vendor id
        buf += "\x00"  # next payload
        buf += "\x00"
        vid = "\x40\x48\xb7\xd5\x6e\xbc\xe8\x85\x25\xe7\xde\x7f\x00\xd6\xc2\xd3"
        buf += struct.pack(">H", len(vid) + 4)
        buf += vid

        return buf.replace("$$$$", struct.pack(">L", len(buf)))

#ikev2 scan
class ikev2(object):
    def __init__(self, host, host_port, id=None):
        if id == None:
            id = ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(8))

        self._host = host
        self._port = host_port
        self._sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self._sock.settimeout(1.0)
        self._id = id
        self._mid = 1

        # Init session
        self.send(self.Ikev2_SA())

        # Check if we got something
        self.recv()

    # UPD socket helpers
    def send(self, buf):
        self._sock.sendto(buf, (self._host, self._port))

    def recv(self, size=4096):
        try:
            data, addr = self._sock.recvfrom(size)
            info['ikev2'] = 1
        except socket.timeout:
            pass

    def Ikev2_SA(self):
        buf = ""
        buf += self._id  # Initiator SPI
        buf += "\x00" * 8  # Responder SPI
        buf += "\x21"  # next payload (security association)
        buf += "\x20"  # version
        buf += "\x22"  # exchange type
        buf += "\x08"  # flags
        buf += "\x00" * 4  # message ID
        buf += "$$$$"  # length

        # THIS IS SECURITY ASSOCIATION
        buf += "\x22\x00\x00\x6c\x00\x00\x00\x68\x01\x01\x00\x0b\x03\x00\x00\x0c\x01\x00\x00\x0c\x80\x0e\x01\x00\x03\x00\x00\x0c\x01\x00\x00\x0c\x80\x0e\x00\x80\x03\x00\x00\x08\x01\x00\x00\x03\x03\x00\x00\x08\x01\x00\x00\x02\x03\x00\x00\x08\x02\x00\x00\x02\x03\x00\x00\x08\x02\x00\x00\x01\x03\x00\x00\x08\x03\x00\x00\x02\x03\x00\x00\x08\x03\x00\x00\x01\x03\x00\x00\x08\x04\x00\x00\x02\x03\x00\x00\x08\x04\x00\x00\x05\x00\x00\x00\x08\x04\x00\x00\x0e"

        # THIS IS KEY EXCHANGE
        # this is the type of the next payload...
        buf += "\x28"  # 0x28 = Nonce, 0x2b = vendor ID
        # KEY EXCHANGE DATA
        buf += "\x00\x00\x88\x00\x02\x00\x00\x50\xea\xf4\x54\x1c\x61\x24\x1b\x59\x3f\x48\xcb\x12\x8c\xf1\x7f\x5f\xd4\xd8\xe9\xe2\xfd\x3c\x66\x70\xef\x08\xf6\x56\xcd\x83\x16\x65\xc1\xdf\x1c\x2b\xb1\xc4\x92\xca\xcb\xd2\x68\x83\x8e\x2f\x12\x94\x12\x48\xec\x78\x4b\x5d\xf3\x57\x87\x36\x1b\xba\x5b\x34\x6e\xec\x7e\x39\xc1\xc2\x2d\xf9\x77\xcc\x19\x39\x25\x64\xeb\xb7\x85\x5b\x16\xfc\x2c\x58\x56\x11\xfe\x49\x71\x32\xe9\xe8\x2d\x27\xbe\x78\x71\x97\x7a\x74\x42\x30\x56\x62\xa2\x99\x9c\x56\x0f\xfe\xd0\xa2\xe6\x8f\x72\x5f\xc3\x87\x4c\x7c\x9b\xa9\x80\xf1\x97\x57\x92"

        # this is the Nonce payload
        buf += "\x2b"
        buf += "\x00\x00\x18\x97\x40\x6a\x31\x04\x4d\x3f\x7d\xea\x84\x80\xe9\xc8\x41\x5f\x84\x49\xd3\x8c\xee"
        # lets try a vendor id or three
        buf += "\x2b"  # next payload, more vendor ID
        buf += "\x00"  # critical bit
        vid = "CISCO-DELETE-REASON"
        buf += struct.pack(">H", len(vid) + 4)
        buf += vid

        # another vendor id
        buf += "\x2b"  # next payload, more vendor ID
        buf += "\x00"  # critical bit
        vid = "CISCO(COPYRIGHT)&Copyright (c) 2009 Cisco Systems, Inc."
        buf += struct.pack(">H", len(vid) + 4)
        buf += vid

        # another vendor id
        buf += "\x2b"  # next payload, more vid
        buf += "\x00"  # crit
        vid = "CISCO-GRE-MODE"
        buf += struct.pack(">H", len(vid) + 4)
        buf += vid

        # last vendor id
        buf += "\x00"  # next payload
        buf += "\x00"
        vid = "\x40\x48\xb7\xd5\x6e\xbc\xe8\x85\x25\xe7\xde\x7f\x00\xd6\xc2\xd3"
        buf += struct.pack(">H", len(vid) + 4)
        buf += vid

        return buf.replace("$$$$", struct.pack(">L", len(buf)))

def GetInfo(xmlRespose):
    root = ET.fromstring(xmlRespose)
    info['client'] = root.attrib['client']
    info['type'] = root.attrib['type']
    info['version'] = root[0].text
    info['error_id'] = root[1].attrib['id']
    info['error_info'] = root[1].text

def scan(ip):
    myurl="https://" + ip + "/CSCOSSLC/config-auth"
    req = urllib2.Request(myurl)

    try:
        response = urllib2.urlopen(req)
        strResult= response.read()
        GetInfo(strResult)
        if info['version'] != 'null':
            ikev1(ip, 500)
            ikev2(ip, 500)
        return info
    except Exception ,ex:
        return None

if __name__ == '__main__':
    print scan("188.92.13.186");
