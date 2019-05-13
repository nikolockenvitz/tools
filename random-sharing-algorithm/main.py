"""
A                              B
randint(3,9) -->
                               5
                       5::abcdef
             <-- hash(5::abcdef)
8
8::ghijkl
hash(8::ghijkl) -->
                   <-- 5::abcdef
8::ghijkl -->

           5, 8 => 3

"""

from random import randint
from os import urandom
import hashlib
import math

def create_randint(a, b, salt_length=10):
    r = randint(a, b)
    s = create_salt(salt_length)
    h = create_hash(str(r) + "::" + str(s))
    return [r, s, h]

def verify_randint(text, hash):
    if(create_hash(text) == hash):
        return int(text.split("::")[0])
    return False

def create_salt(length):
    alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_"
    num_bytes = math.ceil(length * 6 / 8)
    random_int = int.from_bytes(urandom(num_bytes), "big")
    salt = ""
    for i in range(length):
        salt += alphabet[random_int % 64]
        random_int >>= 6
    return salt

def create_hash(text, hash_function=hashlib.sha3_256):
    oHash = hash_function()
    oHash.update(str(text).encode())
    return oHash.hexdigest()

def join_random_numbers(a, b, random_numbers):
    r = 0
    for number in random_numbers:
        r += number - a
    r = r%(b-a+1) + a
    return r

random_number, salt, message = create_randint(3, 9)
print(random_number, salt, message)
