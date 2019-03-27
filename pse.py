# TODO: improve performance by sorted list of elements
# TODO: multiple words

pse = """H He
Li Be B C N O F Ne
Na Mg Al Si P S Cl Ar
K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr
Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe
Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn
Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og
"""

elements = []
for line in pse.splitlines():
    elements += line.split(" ")
#print(elements)

def main(word):
    # gets a word and returns a list with all possible representations
    possibilities = []
    for element in elements:
        if(word.lower().startswith(element.lower())):
            if(word.lower() == element.lower()):
                possibilities.append(element)
            else:
                possibilitiesForWordBehindElement = main(word[len(element):])
                for p in possibilitiesForWordBehindElement:
                    possibilities.append(element + "-" + p)
    return possibilities


while(1):
    word = input("Type your word: ")
    for el in main(word):
        print(el)
    print()
    if(word == "exit"):
        if(input("Do you really want to exit? (y/n) ").lower() in ("y","yes")):
            break
