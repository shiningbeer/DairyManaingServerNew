from time import sleep
def scan(ip):
    # sleep(0.5)
    print ip
    if ip!=None:
        return {'ip':ip}
    else:
        return None