from collections import defaultdict

combinations8 = """
01 02 03 04 05 06 07 08

01 09 10 11 12 13 14 15
01 16 17 18 19 20 21 22
01 23 24 25 26 27 28 29
01 30 31 32 33 34 35 36
01 37 38 39 40 41 42 43
01 44 45 46 47 48 49 50
01 51 52 53 54 55 56 57

02 09 16 23 30 37 44 51
02 10 17 24 31 38 45 52
02 11 18 25 32 39 46 53
02 12 19 26 33 40 47 54
02 13 20 27 34 41 48 55
02 14 21 28 35 42 49 56
02 15 22 29 36 43 50 57

03 09 17 25 33 41 49 57
03 10 18 26 34 42 50 51
03 11 19 27 35 43 44 52
03 12 20 28 36 37 45 53
03 13 21 29 30 38 46 54
03 14 22 23 31 39 47 55
03 15 16 24 32 40 48 56

04 09 18 27 36 38 47 56
04 10 19 28 30 39 48 57
04 11 20 29 31 40 49 51
04 12 21 23 32 41 50 52
04 13 22 24 33 42 44 53
04 14 16 25 34 43 45 54
04 15 17 26 35 37 46 55

05 09 19 29 32 42 45 55
05 10 20 23 33 43 46 56
05 11 21 24 34 37 47 57
05 12 22 25 35 38 48 51
05 13 16 26 36 39 49 52
05 14 17 27 30 40 50 53
05 15 18 28 31 41 44 54

06 09 20 24 35 39 50 54
06 10 21 25 36 40 44 55
06 11 22 26 30 41 45 56
06 12 16 27 31 42 46 57
06 13 17 28 32 43 47 51
06 14 18 29 33 37 48 52
06 15 19 23 34 38 49 53

07 09 21 26 31 43 48 53
07 10 22 27 32 37 49 54
07 11 16 28 33 38 50 55
07 12 17 29 34 39 44 56
07 13 18 23 35 40 45 57
07 14 19 24 36 41 46 51
07 15 20 25 30 42 47 52

08 09 22 28 34 40 46 52
08 10 16 29 35 41 47 53
08 11 17 23 36 42 48 54
08 12 18 24 30 43 49 55
08 13 19 25 31 37 50 56
08 14 20 26 32 38 44 57
08 15 21 27 33 39 45 51
"""

def parse_combinations_from_str(multi_line_str):
    combinations = []
    for line in multi_line_str.split("\n"):
        combination = line.strip().split()
        if len(combination) > 0:
            combinations.append(combination)
    return combinations

def validate_combinations(_combinations, fail_on_uneven_distribution=False):
    combinations = parse_combinations_from_str(_combinations) if type(_combinations) == str else _combinations

    n = len(combinations[0])
    symbols_with_count = defaultdict(lambda: 0)
    symbols_with_match_count = defaultdict(lambda: 0)
    for i in range(0, len(combinations)):
        if (fail_on_uneven_distribution and len(combinations[i]) != n):
            return False
        for symbol in combinations[i]:
            symbols_with_count[symbol] = symbols_with_count[symbol] + 1
        for j in range(i+1, len(combinations)):
            intersection = intersect(combinations[i], combinations[j])
            if len(intersection) != 1:
                return False
            common_symbol = intersection[0]
            symbols_with_match_count[common_symbol] = symbols_with_match_count[common_symbol] + 1

    if fail_on_uneven_distribution:
        # somewhat redundant, but we do multiple checks to ensure it's an even/perfect distribution
        ideal_count = n**2 - n + 1
        ideal_match_count = (ideal_count - 1) / 2

        # 1. Fail if not max number of combinations (n² - n + 1)
        if len(combinations) != ideal_count: return False

        # 2. Fail if not max number of symbols (n² - n + 1)
        if len(symbols_with_count.keys()) != ideal_count: return False

        # 3. Fail if symbols don't appear in same quantity (n)
        for symbol_count in symbols_with_count.values():
            if (symbol_count != n): return False

        # 4. Fail if number of matches per symbol is not the same ((n² - n) / 2)
        for match_count in symbols_with_match_count.values():
            if (match_count != ideal_match_count): return False

    return True

def intersect(*lists):
    if len(lists) == 0: return []
    intersection = set(lists[0])
    for lst in lists[1:]:
        intersection &= set(lst)
    return list(intersection)

def generate_combinations(n):
    # TODO: abort if n-1 is not prime
    combinations = []
    combinations.append(list(range(1, n+1)))

    extra_symbols = []
    for i in range(n-1):
        offset = n + 1 + i*(n-1)
        cur_extra_symbols = list(range(offset, offset + n-1))
        combinations.append([1, *cur_extra_symbols])
        extra_symbols.append(cur_extra_symbols)

    for i in range(n-1):
        for j in range(n-1):
            combination = [i+2]
            for k in range(n-1):
                combination.append(extra_symbols[k][(i*k+j) % (n-1)])
            combinations.append(combination)

    return combinations

c8 = parse_combinations_from_str(combinations8)
print("is own solution for n=8 valid/perfect?", validate_combinations(c8, fail_on_uneven_distribution=True))

# 6->31, 8->57, 12->133
c6 = generate_combinations(6)
c8 = generate_combinations(8)

for i in range(3, 14):
    ci = generate_combinations(i)
    print(i, validate_combinations(ci), validate_combinations(ci, fail_on_uneven_distribution=True))
