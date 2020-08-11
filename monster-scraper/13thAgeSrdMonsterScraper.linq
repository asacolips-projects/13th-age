<Query Kind="Program">
  <Reference>&lt;RuntimeDirectory&gt;\System.Web.dll</Reference>
  <NuGetReference>Newtonsoft.Json</NuGetReference>
  <NuGetReference>ScrapySharp</NuGetReference>
  <Namespace>HtmlAgilityPack</Namespace>
  <Namespace>Microsoft.FSharp.Collections</Namespace>
  <Namespace>Microsoft.FSharp.Control</Namespace>
  <Namespace>Microsoft.FSharp.Core</Namespace>
  <Namespace>Microsoft.FSharp.Core.CompilerServices</Namespace>
  <Namespace>Microsoft.FSharp.Data.UnitSystems.SI.UnitNames</Namespace>
  <Namespace>Microsoft.FSharp.Linq</Namespace>
  <Namespace>Microsoft.FSharp.Linq.QueryRunExtensions</Namespace>
  <Namespace>Microsoft.FSharp.Linq.RuntimeHelpers</Namespace>
  <Namespace>Microsoft.FSharp.NativeInterop</Namespace>
  <Namespace>Microsoft.FSharp.Quotations</Namespace>
  <Namespace>Microsoft.FSharp.Reflection</Namespace>
  <Namespace>Newtonsoft.Json</Namespace>
  <Namespace>Newtonsoft.Json.Bson</Namespace>
  <Namespace>Newtonsoft.Json.Converters</Namespace>
  <Namespace>Newtonsoft.Json.Linq</Namespace>
  <Namespace>Newtonsoft.Json.Schema</Namespace>
  <Namespace>Newtonsoft.Json.Serialization</Namespace>
  <Namespace>ScrapySharp.Cache</Namespace>
  <Namespace>ScrapySharp.Core</Namespace>
  <Namespace>ScrapySharp.Exceptions</Namespace>
  <Namespace>ScrapySharp.Extensions</Namespace>
  <Namespace>ScrapySharp.Html</Namespace>
  <Namespace>ScrapySharp.Html.Dom</Namespace>
  <Namespace>ScrapySharp.Html.Forms</Namespace>
  <Namespace>ScrapySharp.Html.Parsing</Namespace>
  <Namespace>ScrapySharp.Network</Namespace>
  <Namespace>System</Namespace>
  <Namespace>System.Collections.Generic</Namespace>
  <Namespace>System.Linq</Namespace>
  <Namespace>System.Net</Namespace>
  <Namespace>System.Runtime.Caching</Namespace>
  <Namespace>System.Runtime.Caching.Configuration</Namespace>
  <Namespace>System.Runtime.Caching.Hosting</Namespace>
  <Namespace>System.Text.RegularExpressions</Namespace>
  <Namespace>System.Web</Namespace>
</Query>

void Main()
{
	var monsters = new SrdMonsterScraper().Scrape();
	//monsters.Dump();
	MonsterConverter.ConvertMonstersToJson(monsters);
}

public class SrdMonsterScraper
{
	private const string SrdMonsterUrl = "https://www.13thagesrd.com/monsters";

	public List<Monster> Scrape()
	{
		return ScrapePage(SrdMonsterUrl);
	}

	private List<Monster> ScrapePage(string url)
	{
		var web = new HtmlWeb();
		url = HttpUtility.UrlDecode(url);
		url = url.TrimEnd('?');
		if (!url.StartsWith("https://")) url = "https://" + url;
		var document = web.Load(url);
		var response = document.DocumentNode;
		
		var incorrectMonsters = new List<string>()
		{
			"Dire Bat",
			"Hell Imp",
			"Drow Sword Maiden"
		};
		
		var incorrectMonsterTables = new List<string>() {
			"Hoardsong Dragon (Red)",
			"Greathoard Elder (Red)"
		};
		
		var incorrectMonsterHeaders = new Dictionary<string, string>
		{ 
			{ "Ankheg", "Azer Soldier" },
			{ "Basilisk", "Swarm of Bats" },
			{ "Drider", "Drow Spider-Mage" },
			{ "Ettin", "Death Blossom" },
			{ "Harpy", "Watch Skull" },
			{ "Hellhound", "Human Thug" },
			{ "Hungry Star", "Five-Headed Hydra" },
			{ "Minotaur", "Swaysong Naga" },
			{ "Mummy", "Swaysong Naga" },
			{ "Otyugh", "Pixie Warrior" },
			{ "Owlbear", "Pixie Warrior" },
			{ "Phase Spider", "Pixie Warrior" },
			{ "Gargoyle" , "Gelatinous Tetrahedron"},
			{ "Rakshasa", "Splotchcap" },
			{ "Tarrasque", "Avenging Orb" },
			{ "Troll", "Vampire" },
			{ "Whispering Prophet", "Zombie Shuffler" },
			{ "Wibble", "Zombie Shuffler" },
			{ "Wight", "Zombie Shuffler" },
			{ "Wraith", "Zombie Shuffler" },
			{ "Wyvern", "Zombie Shuffler" },
		};
		
		var tablesToSkip = new List<string>() {
			"Save Penalty",
			"Icon-centered Abilities",
			"Demonic Ability",
			"Devil Ability",
			"Variable Waiting Period",
			"Dragon Ability",
			"Ooze Ability",
		};

		var monsterNames = response.CssSelect("h4 > span").Select(x => x.InnerText)
			.Where(x => !incorrectMonsterTables.Contains(x))
			//.SkipWhile(x => x != "Wrecker").Skip(1)
			.ToList();
			
		foreach (var incorrectlyHeaderedName in incorrectMonsterHeaders)
		{
			var insertBefore = monsterNames.IndexOf(incorrectlyHeaderedName.Value);
			monsterNames.Insert(insertBefore, incorrectlyHeaderedName.Key);
		}
			
		//monsterNames.Dump();
			
		var monsterDetails = response
			.CssSelect("table")
			//.SkipWhile(x => !x.InnerText.Contains("Size/Strength regular, large, or huge; Level level; Role role; Type type"))
			.Skip(1)
			.Where(x => x.InnerText.Contains("ACPDMDHP"))
			//.Where(x => !tablesToSkip.Any(toSkip => x.InnerText.StartsWith(toSkip)))
			.TakeWhile( x => !x.InnerText.Contains("Section 15"))
			.ToList();

		$"{monsterNames.Count} monster names, {monsterDetails.Count} details".Dump();

		var failures = 0;
		var toReturn = new List<Monster>();
		for (int x = 0; x < monsterNames.Count; x++)
		//for (int x = 200; x < monsterNames.Count; x++)
		{
			x.Dump();
			if (incorrectMonsters.Contains(monsterNames[x]))
			{
				"Skipping incorrect monster".Dump();
				continue;
			}
			try
			{
				var monster = ScrapeMonster(monsterNames[x], monsterDetails[x]);
				monster.Dump();
				toReturn.Add(monster);
			}
			catch (Exception e)
			{
				failures++;
				$"{monsterNames[x]} failed!".Dump();
				e.Dump();
			}
		}

		$"There were {failures} scraping failures".Dump();
		return toReturn;
	}

	private Monster ScrapeMonster(string name, HtmlNode table)
	{
		var monster = new Monster()
		{
			Name = name
		};

		var tableInfo = table.ChildNodes[0].ChildNodes[0];
		
		if (tableInfo.ChildNodes.Count < 4)
		{
			throw new Exception("Not enough elements in table!");
		}

		var standardInfo = tableInfo.ChildNodes[0];
		var attacksInfo = tableInfo.ChildNodes[1];
		var defenseInfo = tableInfo.ChildNodes[3];

		GetStandardInfo(monster, standardInfo);
		GetDefenses(monster, defenseInfo);
		GetAttacks(monster, attacksInfo);

		//monster.Dump();
		return monster;
	}

	private static void GetAttacks(Monster monster, HtmlNode attacksInfo)
	{
		Attack currentAttack = null;
		bool areTraitsNastierSpecials = false;

		for (int x = 0; x <= attacksInfo.ChildNodes.Count - 1; x ++)
		{
			var line = attacksInfo.ChildNodes[x];
			ProcessLine(monster, attacksInfo, ref currentAttack, ref areTraitsNastierSpecials, line);
		}
		monster.Attacks.Add(currentAttack);
	}

	private static void ProcessLine(Monster monster, HtmlNode attacksInfo, ref Attack currentAttack, ref bool areTraitsNastierSpecials, HtmlNode line)
	{
		"".Dump();
		
		var linesToIgnore = new List<string>() {
			"And it has one additional ability",
			"Last Gasp Failed Save Effects",
			"A slime devil seems unremarkable and innocuous, so downplay its significance whenever describing it, especially when it has company. When mortals actually decide to attack or capture a honey devil, it’s probably slippery enough to escape at the last minute, maybe through a hidden exit.",
			"Level 6 Void Beast",
			"AC 22",
			"PD 20",
			"MD 18",
			"HP 27",
			"On Holy Ground",
			"Fungal attack—Make ONE fungal attack"
		};
		
		var basiliskInfo = new List<string>() { "Green Basilisk", "Red Basilisk", "Black Basilisk", "White Basilisk" };
		var currentBasiliskType = string.Empty;

		line.InnerHtml.Dump();
		
		if (linesToIgnore.Any(x => line.InnerText.StartsWith(x)))
		{
			$"Ignoring line".Dump();
		}
		else if (line.InnerText.Contains("Choose ONE")) {
			$"Ignoring line".Dump();
		}
		else if (line.InnerText.StartsWith("Initiative:"))
		{
			"Line is Initiative".Dump();
			var numberRegex = @"(\d+)";
			var numberRegexMatches = Regex.Match(line.InnerText, numberRegex);

			if (numberRegexMatches.Success)
			{
				monster.Initiative = int.Parse(numberRegexMatches.Groups[1].Value.Trim());
			}
		}
		else if 
		(
			(!line.InnerHtml.StartsWith("<i>") || line.InnerText.Contains("[Special trigger]") || line.InnerText.Contains("[Group ability]")) &&
			(
				(line.InnerHtml.Contains("+") && line.InnerHtml.Contains("vs")) || 
				(line.InnerText.Contains("Ranged:") || line.InnerText.StartsWith("C: Banner magic") || line.InnerText.Contains("R:"))
			)
		)
		{
			if (currentAttack != null)
			{
				monster.Attacks.Add(currentAttack);
			}
			areTraitsNastierSpecials = false;

			currentAttack = ProcessAttackHeader(line);
		}
		else if (line.InnerHtml.Contains("Nastier Specials"))
		{
			"Line indicates start of Nastier Specials".Dump();
			areTraitsNastierSpecials = true;
		}
		else if (Attack.AttackModifiers.Any(m => line.InnerHtml.Contains(m)))
		{
			"Line is an attack modifier".Dump();

			if (line.InnerHtml.Contains("Natural") || line.InnerHtml.Contains("Miss"))
			{
				currentAttack.Triggers.Add(new AttackTrigger()
				{
					Trigger = line.InnerText.Split(':').First().Trim(),
					Effect = ProcessStringWithHtmlAndRolls(line.InnerText.Split(':').Last().Trim())
				});
			}
			else
			{
				currentAttack.Description += line.InnerText;
			}
		}
		else if (line.InnerHtml.Contains("</i>") || line.InnerText.StartsWith("Resist fire"))
		{
			"Line is a Trait".Dump();
			
			var trait = new Trait()
			{
				Name = WebUtility.HtmlDecode(line.InnerText.Split(':').First().Trim()),
				Effect = ProcessStringWithHtmlAndRolls(line.InnerText.Split(':').Last().Trim())
			};
			
			if (monster.Name == "Basilisk" && !string.IsNullOrEmpty(currentBasiliskType))
			{
				trait.Name = currentBasiliskType + " " + trait.Name;
			}

			if (areTraitsNastierSpecials)
			{
				monster.NastierSpecials.Add(trait);
			}
			else
			{
				monster.Traits.Add(trait);
			}
		}
		else if (line.InnerText.StartsWith("Vulnerability"))
		{
			"Line is a Vulnerability".Dump();
			monster.Vulnerability = line.InnerText.Replace("Vulnerability:", "").Trim();
		}
		else if (line.InnerText.StartsWith("Resistance:"))
		{
			"Line is a Resistance".Dump();
			monster.Resistance = line.InnerText.Replace("Resistance:", "").Trim();
		}
		else if (line.InnerText.Contains("attack bonus against any enemy it is grabbing."))
		{
			var trait = new Trait()
			{
				Name = "Strong grasp",
				Effect = line.InnerText
			};

			monster.Traits.Add(trait);
		}
		else if (line.InnerText.StartsWith("Engulf and dissolve:"))
		{
			var trait = new Trait()
			{
				Name = "Engulf and dissolve",
				Effect = WebUtility.HtmlDecode(line.InnerText.Replace("Engulf and dissolve:", ""))
			};

			monster.Traits.Add(trait);
		}
		else if (line.InnerText.Contains("After the first success, the grace die bumps up"))
		{
			MergeOrAddTrait("grace", "Graceful", monster, line);
		}
		else if (line.InnerText.StartsWith("Any engulfed creature"))
		{
			MergeOrAddTrait("Engulf", "Engulf", monster, line);
		}
		else if (line.InnerText.StartsWith("A wraith can move through solid objects"))
		{
			MergeOrAddTrait("Ghostly", "Ghostly", monster, line);
		}
		else if (line.InnerText.StartsWith("If a chaos beast and a chaos brute combine to create a chaos behemoth"))
		{
			MergeOrAddTrait("Chaos combined", "Chaos combined", monster, line);	
		}
		else if (line.InnerText.StartsWith("While on “holy ground”"))
		{
			MergeOrAddTrait("On Holy Ground", "On Holy Ground", monster, line);	
		}
		else if (line.InnerText.StartsWith("4. As a standard action the ooze"))
		{
			MergeOrAddTrait("Instinctive - Oozes Quickly", "Instinctive - Oozes Quickly", monster, line);
		}
		else if (line.InnerText.StartsWith("1. The cubahedron jiggles in place"))
		{
			MergeOrAddTrait("Instinctive - Jiggles in Place", "Instinctive - Jiggles in Place", monster, line);
		}
		else if (line.InnerText.StartsWith("2. The cubahedron moves"))
		{
			MergeOrAddTrait("Instinctive - Moves", "Instinctive - Moves", monster, line);
		}
		else if (line.InnerText.StartsWith("3. The cubahedron spits"))
		{
			MergeOrAddTrait("Instinctive - Spits", "Instinctive - Spits", monster, line);
		}
		else if (line.InnerText.StartsWith("4. The cubahedron flattens"))
		{
			MergeOrAddTrait("Instinctive - Flattens", "Instinctive - Flattens", monster, line);
		}
		else if (line.InnerText.StartsWith("5. The cubahedron moves"))
		{
			MergeOrAddTrait("Instinctive - Moves Creature", "Instinctive - Moves Creature", monster, line);
		}
		else if (line.InnerText.StartsWith("6. The cubahedron spits"))
		{
			MergeOrAddTrait("Instinctive - Spits Out", "Instinctive - Spits Out", monster, line);
		}
		else if (line.InnerText.StartsWith("Jump &amp; Scuttle"))
		{
			var trait = new Trait()
			{
				Name = "Jump & Scuttle",
				Effect = WebUtility.HtmlDecode(line.InnerText.Replace("Jump &amp; Scuttle—", ""))
			};

			monster.Traits.Add(trait);
		}
		else if (line.InnerText == "Bite +6; 5 damage")
		{
			if (currentAttack != null)
			{
				monster.Attacks.Add(currentAttack);
			}
			areTraitsNastierSpecials = false;
			
			currentAttack = new Attack() {
				Name = "Bite",
				Bonus = 6,
				Damage = "5 damage",
				Target = "AC"
			};
		}
		else if (line.InnerText == "Tentacles and talons—60 damage")
		{
			if (currentAttack != null)
			{
				monster.Attacks.Add(currentAttack);
			}
			areTraitsNastierSpecials = false;

			currentAttack = new Attack()
			{
				Name = "Tentacles and talons",
				Bonus = 18,
				Damage = "60 damage",
				Target = "AC"
			};
		}
		else if (basiliskInfo.Contains(line.InnerText)) {
			currentBasiliskType = line.InnerText;
		}
		else
		{
			throw new Exception("Unknown line! " + line.InnerText);
		}
	}

	private static void MergeOrAddTrait(string key, string name, Monster monster, HtmlNode line)
	{
		var trait = monster.Traits.FirstOrDefault(x => x.Name.Contains(key));

		if (trait != null)
		{
			trait.Effect += " " + WebUtility.HtmlDecode(line.InnerText);
		}
		else
		{
			monster.Traits.Add(new Trait()
			{
				Name = name,
				Effect = WebUtility.HtmlDecode(line.InnerText)
			});
		}
	}

	private static string ProcessStringWithHtmlAndRolls(string toProcess)
	{
		var toReturn = WebUtility.HtmlDecode(toProcess);
		
		var diceRegex = @"\d*d\d+";
		var diceRegexMatches = Regex.Matches(toReturn, diceRegex);
		
		foreach (Match match in diceRegexMatches)
		{
			if (match.Success)
			{
				var toReplace = match.Value;
				toReturn = toReturn.Replace(toReplace, $"[[{toReplace}]]");
			}
		}
		
		return toReturn;
	}

	private static Attack ProcessAttackHeader(HtmlNode line)
	{
		"Line is an attack header".Dump();

		var cleanLine = ProcessStringWithHtmlAndRolls(line.InnerText)
			.Replace("<b>", "").Replace("</b>", "")
			.Replace("<i>", "").Replace("</i>", "")
			.Replace(") – ", ");") 
			.Replace("—", ";");

		var targetDetailsRegex = @"\(.*?\)";
		var targetDetailsRegexMatch = Regex.Match(cleanLine, targetDetailsRegex);

		if (targetDetailsRegexMatch.Success)
		{
			var toReplace = targetDetailsRegexMatch.Groups[0].Value;
			var replacement = toReplace.Replace(";", "<SEMICOLON>");
			$"Replacing '{toReplace}' with '{replacement}'".Dump();
			cleanLine = cleanLine.Replace(toReplace, replacement);
		}
		cleanLine.Dump();

		if (cleanLine.Contains("Magic missile"))
		{
			var magicMissleRegex = @"(.*)(\(.*?\))[;,](.*)";
			var magicMissleRegexMatches = Regex.Match(cleanLine, magicMissleRegex);

			if (magicMissleRegexMatches.Success)
			{
				return new Attack()
				{
					Name = magicMissleRegexMatches.Groups[1].Value.Trim(),
					Bonus = -1,
					Target = magicMissleRegexMatches.Groups[2].Value.Trim().Replace("<SEMICOLON>", ";"),
					Damage = magicMissleRegexMatches.Groups[3].Value.Trim()
				};
			}
			else
			{
				throw new Exception($"Could not parse Magic Missle line '{cleanLine}'");
			}
		}

		var attackBonusRegex = @"(\(.*\))\s*vs";
		var attackBonusRegexMatches = Regex.Match(cleanLine, attackBonusRegex);

		if (attackBonusRegexMatches.Success)
		{
			"Removing Attack Bonus".Dump();
			cleanLine = cleanLine.Replace(attackBonusRegexMatches.Groups[1].Value.Trim(), "");
		}
		
		var attackRegex = @"(.*)(\+ *(\d+)) *vs\.* (.*?)[;,](.*)";
		var attackRegexMatches = Regex.Match(cleanLine, attackRegex);

		if (attackRegexMatches.Success)
		{
			return new Attack()
			{
				Name = attackRegexMatches.Groups[1].Value.Trim(),
				Bonus = int.Parse(attackRegexMatches.Groups[3].Value.Trim()),
				Target = attackRegexMatches.Groups[4].Value.Trim().Replace("<SEMICOLON>", ";"),
				Damage = attackRegexMatches.Groups[5].Value.Trim()
			};
		}
		else
		{
			throw new Exception($"Could not parse line '{cleanLine}'");
		}
	}

	private static void GetDefenses(Monster monster, HtmlNode defense)
	{
		monster.AC = int.Parse(defense.ChildNodes[0].InnerText.Trim());
		monster.PD = int.Parse(defense.ChildNodes[1].InnerText.Trim());
		monster.MD = int.Parse(defense.ChildNodes[2].InnerText.Trim());
		monster.HP = int.Parse(defense.ChildNodes[3].InnerText.Replace("(each)", "").Trim());
	}

	private static void GetStandardInfo(Monster monster, HtmlNode standardInfo)
	{
		var typeInfo = standardInfo.ChildNodes[0];
		var cleanText = typeInfo.InnerText
			.Replace("X2", "2x");
			
		monster.Size = cleanText;

		var levelRegex = @"(\d+)";
		var levelRegexMatches = Regex.Match(standardInfo.ChildNodes[1].InnerText, levelRegex);

		if (levelRegexMatches.Success)
		{
			monster.Level = int.Parse(levelRegexMatches.Groups[1].Value.Trim());
		}
		
		monster.Role = UpperCaseFirstCharacter(standardInfo.ChildNodes[2].InnerText);
		monster.Type = UpperCaseFirstCharacter(standardInfo.ChildNodes[3].InnerText);
	}
}

public static string UpperCaseFirstCharacter(string toUppercase)
{
	return char.ToUpper(toUppercase[0]) + new string(toUppercase.Skip(1).ToArray());
}

public class Monster
{
	public string Name { get; set; }
	public string Size { get; set; }
	public int Level { get; set; }
	public string Role { get; set; }
	public string Type { get; set; }

	public int Initiative { get; set; }
	public int AC { get; set; }
	public int PD { get; set; }
	public int MD { get; set; }
	public int HP { get; set; }
	
	public string Vulnerability { get; set; } = "";
	public string Resistance { get; set; } = "";

	public List<Attack> Attacks { get; set; } = new List<Attack>();

	public List<Trait> Traits { get; set; } = new List<Trait>();
	public List<Trait> NastierSpecials { get; set; } = new List<Trait>();
}

public class Attack
{
	public static List<string> AttackModifiers = new List<string>() { "Natural", "Limited use", "Miss" };

	public string Name { get; set; }
	public int Bonus { get; set; }
	public string Target { get; set; } = "";
	public string Damage { get; set; }
	public List<AttackTrigger> Triggers = new List<AttackTrigger>();
	public string Description { get; set; } = "";

	public string Roll {
		get
		{
			if (Bonus == -1) {
				return "Automatic hit";
			}
			return $"[[d20 + {Bonus}]] vs {Target}";
		}
	}
}

public class AttackTrigger
{
	public string Trigger { get; set; }
	public string Effect { get; set; }
}

public class Trait
{
	public string Name { get; set; }
	public string Effect { get; set; }
}


public static class MonsterConverter
{
	public static void ConvertMonstersToJson(List<Monster> monsters) {
	
		var convertedMonsters = new List<ActorArchmageData>();

		var failures = 0;
		foreach (var monster in monsters)
		{
			try
			{
				var converted = ConvertMonsterToArchmageData(monster);
				convertedMonsters.Add(converted);
				//converted.Dump();
			}
			catch (Exception e)
			{
				$"{monster.Name} failed conversion".Dump();
				e.Dump();
				failures++;
			}
		}

		$"There were {failures} failures in converting".Dump();
		
		var jsonSerializationSettings = new JsonSerializerSettings() {
			NullValueHandling = NullValueHandling.Ignore,
			Formatting = Newtonsoft.Json.Formatting.Indented
		};
		var json = JsonConvert.SerializeObject(convertedMonsters, jsonSerializationSettings);
		
		File.WriteAllText(@"D:\Programming\Git\FoundryVTT-13th-Age-SRD\monsters.json", json);
	}
	
	private static ActorArchmageData ConvertMonsterToArchmageData(Monster monster) {
		var toReturn = new ActorArchmageData() {
			data = new ActorData() {
				attributes = new Attributes() {
					ac = new Score("Armor Class", monster.AC) { baseScore = 10, min = 0 },
					hp = new Score("Hit Points", monster.HP) { baseScore = 10, min = 0, max = monster.HP },
					init = new Score("Initiative Modifier", monster.Initiative - monster.Level) { mod = monster.Level + monster.Initiative },
					level = new Score("Level", monster.Level) { min = 0, max = 12 },
					md = new Score("Mental Defense", monster.MD) { baseScore = 10, min = 0 },
					pd = new Score("Physical Defense", monster.PD) { baseScore = 10, min = 0 },
				},
				details = new Details()
				{
					level = new Score("Level", monster.Level) { min = 0, max = 12 },
					resistance = new UserQuery.Value<string>("Resistance", monster.Resistance) { type = "String" },
					vulnerability = new UserQuery.Value<string>("Vulnerability", monster.Vulnerability) { type = "String" },
					size = new UserQuery.Value<string>("Size", monster.Size) { type = "String" },
					role = new UserQuery.Value<string>("Role", monster.Role) { type = "String" },
					type = new UserQuery.Value<string>("Type", monster.Type) { type = "String" },
				}
			},
			token = new ActorToken() {
				name = monster.Name
			},
			//name = $"{monster.Name} ({monster.Size} Level {monster.Level} {monster.Role}) [{monster.Type}]"
			name = monster.Name
		};
		
		var amtAdded = 0;

		foreach (var attack in monster.Attacks)
		{
			var actionData = new ActionData()
			{
				attack = new UserQuery.Value<string>("Attack Roll", attack.Roll),
				description = new UserQuery.Value<string>("Description", attack.Description),
				hit = new UserQuery.Value<string>("Hit", attack.Damage)
			};

			foreach (var trigger in attack.Triggers) {
				if (trigger.Trigger.Contains("Miss")) {
					actionData.miss = new UserQuery.Value<string>("Hit", trigger.Effect) { name = trigger.Trigger };
				}
				else if (actionData.hit1 == null) {
					actionData.hit1 = new UserQuery.Value<string>("Hit", trigger.Effect) { name = trigger.Trigger };
				}
				else if (actionData.hit2 == null)
				{
					actionData.hit2 = new UserQuery.Value<string>("Hit", trigger.Effect) { name = trigger.Trigger };
				}
				else if (actionData.hitt3 == null)
				{
					actionData.hitt3 = new UserQuery.Value<string>("Hit", trigger.Effect) { name = trigger.Trigger };
				}
				else {
					throw new Exception("Ran out of space for Hit triggers!");
				}
			}

			toReturn.items.Add(new ActionItem() {
				name = attack.Name,
				sort = amtAdded++ * 100000,
				data = actionData
			});
		}
		
		foreach (var trait in monster.Traits) {
			toReturn.items.Add(new TraitItem() {
				name = trait.Name,
				sort = amtAdded++ * 100000,
				data = new TraitData() {
					description = new UserQuery.Value<string>("Description", trait.Effect)
				}
			});
		}

		foreach (var trait in monster.NastierSpecials)
		{
			toReturn.items.Add(new NastierItem()
			{
				name = trait.Name,
				sort = amtAdded++ * 100000,
				data = new TraitData()
				{
					description = new UserQuery.Value<string>("Description", trait.Effect)
				}
			});
		}

		return toReturn;
	}
}


public class ActorArchmageData {
	public ActorData data { get; set; }
	public string folder => "RojSIAWRQfItUAUV";
	public string img => "icons/svg/mystery-man.svg";
	public List<Item> items { get; set; } = new List<Item>();
	public ActorToken token { get; set; }
	public string type => "npc";
	public string name { get; set; }
}

public class ActorData {
	public Abilities abilities { get; set; }
	
	public Attributes attributes { get; set; }
	
	//public Backgrounds backgrounds { get; set; }
	
	public Details details { get; set; }
}

public class Abilities {
	public Score cha { get; set; }
	
	public Score str { get; set; }
	
	public Score con { get; set; }
	
	public Score dex { get; set; }
	
	[JsonProperty("int")]
	public Score intellegence { get; set; }
	
	public Score wis { get; set; }
}

public class Attributes {
	public Score ac { get; set; }
	
	public Score hp { get; set; }
	
	public Score init { get; set; }
	
	public Score level { get; set; }
	
	public Score md { get; set; }
	
	public Score pd { get; set; }
	
	public Score recoveries { get; set; }
}

public class Details {
	public Score level { get; set; }
	
	public Value<string> resistance { get; set; }
	
	public Value<string> role { get; set; }
	
	public Value<string> size { get; set; }
	
	public Value<string> type { get; set; }
	
	public Value<string> vulnerability { get; set; }
}

public abstract class Item {
	public string img => "icons/svg/mystery-man.svg";
	public string name { get; set; }
	public int sort { get; set; } = 0;

	public abstract string type { get; }
}

public class ActionItem : Item
{
	public override string type => "action";
	
	public ActionData data { get; set; }
}

public class TraitItem : Item
{
	public override string type => "trait";
	
	public TraitData data { get; set; }
}

public class NastierItem : TraitItem
{
	public override string type => "nastierSpecial";
}

public class ActionData {
	public Value<string> attack { get; set; }
	
	public Value<string> description { get; set; }
	
	public Value<string> hit { get; set; }
	
	public Value<string> hit1 { get; set; }
	public Value<string> hit2 { get; set; }
	public Value<string> hitt3 { get; set; }
	
	public Label hit3 => new Label("Hit");
	public Label hit4 => new Label("Hit");
	public Label hit5 => new Label("Hit");
	
	public Value<string> miss { get; set; }
	
	public Label name => new Label("Name");
}

public class TraitData {
	public Label name => new Label("Name");
	
	public Value<string> description { get; set; }
}

public class Label : Value<string> {
	public override string type { get; set; }= "String";
	
	public Label(string label) : base(label){
	}
}

public class Value<T>
{
	public virtual string type { get; set; } = "";

	public virtual string label { get; set; } = "";
	
	public virtual string name { get; set; } = null;
	
	public T value { get; set; }

	public Value(string label)
	{
		this.label = label;
	}

	public Value(string label, T value)
	{
		this.label = label;
		this.value = value;
	}
}

public class Score : Value<int>
{
	public override string type { get; set; } = "Number";

	public int? min { get; set; }

	public int? max { get; set; }

	[JsonProperty("base")]
	public int? baseScore { get; set; }
	
	public int? mod { get; set; }

	public Score(string label, int value) : base(label, value)
	{
	}
}

public class ActorToken {
	public string name { get; set; } = string.Empty;
}
